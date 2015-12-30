var fs = require('fs');
var path = require('path');
var fm = require('front-matter');
var Liquid = require('liquid-node');
var slug = require('slug');
var cheerio = require('cheerio');
var mkdirp = require('mkdirp');
var marked = require('marked');
var promisify = require('promisify-node');
var glob = promisify(require('glob'));
var locationParser = require('./parse-location');

var engine = new Liquid.Engine();
var defaultConfig = {
  includesDir: 'includes',
  layoutsDir: 'layouts',
  pagesDir: 'pages',
  outDir: '_site',
  baseurl: '',
  showDemoTester: true,
  travisBaseUrl: "https://travis-ci.org",
  markdownExtensions: ['.md']
};
var config = fs.readFileSync('metadata.json', 'utf-8');

if (process.argv[2] === '--prod') {
  defaultConfig.baseurl = '/elements';
}

config = JSON.parse(config);
config = Object.assign({}, defaultConfig, config);
config.elements = config.elements.map(el => new Context(el));
config.categories = config.categories.map(cat => {
  var elements = config.elements.filter(el => el.category === cat.name);
  cat.elements = elements;
  return cat;
});

engine.fileSystem = new Liquid.LocalFileSystem;
engine.fileSystem.root = config.includesDir;

function Context(el) {
  var baseDir, u, dn;
  var loc, travisBaseUrl = config.travisBaseUrl;

  this.name = el.name;
  this.category = el.category;
  this.icon = el.icon;
  this.displayName = dn = el.displayName;
  this.location = loc = locationParser(el.location);

  baseDir = loc.localPath || `_site/${dn}/bower_components/${el.name}`;

  this.documentationFileUrl = `${baseDir}/`;
  this.demoFileUrl = `${baseDir}/demo/index.html`;
  this.propertiesFileUrl = `${baseDir}/property.json`;

  if (loc.githubUser && loc.githubRepo) {
    u = `${travisBaseUrl}/${loc.githubUser}/${loc.githubRepo}`;
    this.linkToTravis = `${u}/`;
    this.buildStatusUrl = `${u}.svg?branch=master`;
  }

  this.designDoc = '\n' + tryReadFile(`${baseDir}/design-doc.md`);
  this.pageName = slug(el.displayName).toLowerCase();
  this.pageUrl = `${config.baseurl}/${this.pageName}.html`;
  this.innerHtml = extractInnerHtml(this.name, this.demoFileUrl);
};

function tryReadFile(path) {
  try {
    return fs.readFileSync(path, 'utf-8');
  } catch(err) {
    return '';
  }
}

function extractInnerHtml(name, fpath) {
  text = tryReadFile(fpath);

  $ = cheerio.load(text);
  innerHTML = $(name).html() || '';

  innerHTML = innerHTML.split('\r\n').map(function(line) {
    return line.replace(/^\s+/, '').replace(/\s+$/, '');
  }).filter(function(line) {
    return Boolean(line);
  }).join('');

  return innerHTML;
};

function resolveLayout(filePath, queue) {
  var file = fs.readFileSync(path.resolve(filePath), 'utf-8');
  var layout;

  file = fm(file);
  queue = queue || [];
  queue.push(file);

  if (file.attributes && (layout = file.attributes.layout)) {
    filePath = `layouts/${layout}.html`;
    resolveLayout(filePath, queue);
  }

  return queue;
}

function renderLayout(queue, context) {
  var p = Promise.resolve('');

  queue.forEach(item => {
    Object.assign(context.page, item.attributes);

    p = p.then(content => {
      context.content = content;

      return engine.parseAndRender(item.body, context);
    });
  });

  return p;
}

mkdirp.sync(config.outDir);

config.elements.forEach(elContext => {
  var file = fs.readFileSync('templates/github.html', 'utf-8');
  var fullContext = {
    site: config,
    page: elContext
  };

  var queue = resolveLayout('templates/github.html')

  renderLayout(queue, fullContext)
    .then(page => {
      var p = elContext.pageName;

      mkdirp.sync(path.join('_site', p));
      p = path.join('_site', p ,'index.html');
      fs.writeFileSync(p, page);
    })
});

glob(`${config.pagesDir}/**`)
  .then(files => {
    files.forEach(filePath => {
      var context = {site: config, page: {}};
      var pathObj = path.parse(filePath);
      var queue;

      if (!fs.statSync(filePath).isFile()) {
        return;
      }

      queue = resolveLayout(filePath);

      if (config.markdownExtensions.indexOf(pathObj.ext) !== -1) {
        queue[0].body = marked(queue[0].body || '');
      }

      renderLayout(queue, context)
        .then(page => {
          var pagesDir = path.resolve(config.pagesDir);
          var outDir = path.resolve(config.outDir);
          var pathObj = path.parse(filePath);

          outDir = path.resolve(pathObj.dir).replace(pagesDir, outDir);
          mkdirp(outDir);
          fs.writeFileSync(path.join(outDir, `${pathObj.name}.html`), page);
        })
        .catch(err => console.log(err.stack));
    });
  })
  .catch(err => console.log(err.stack));
