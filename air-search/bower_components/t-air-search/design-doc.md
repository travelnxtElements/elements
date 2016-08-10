# General Considerations for designing flight search
This is an important and complex component and the one which starts the booking journey for the traveler. There are several issues to consider when designing a flight search widget - 
- Types of trips to be allowed - one way, round trip, multi-city and which one to have as the default selection
- Appropriate ways of displaying origin and destination - Showing the city and airport names, three letter acronym for airport, and including some distinction to show the differences between cities and airports
- Pre-populating the origin field based on location of user
- Mechanism to switch the origin and destination cities with one click
- What should be the level of interaction between the two calendar fields?
- Should the calendar display holidays? 
- Once date has been selected in a calendar control, how should it be displayed in the field - just dd/mm/yy or mm/dd/yy or should the day be mentioned as well?
- Choice of control to use for selecting number of adults, children and infants - dropdowns vs steppers
- Having the number of passengers section displayed upfront vs in a collapsible area
- Allowing for advanced search options like preferred class or airline of travel, non-stop or refundable flights, or flexible dates 

- Automatically taking the user to the next field, once he is done completing a particular field
- Validations specific to the flight search form like maximum number of allowed adults, children and total passengers
- Having error prevention mechanisms for issues like origin and destination not being the same, return date not being prior to travel date

- Visual design aspects like having a background image
- Exploring alternate form design approaches like natural language forms
- Since this widget is basically a form, all form design considerations are also relevant

# t-air-search: Feature selection and implementation
- t-air-search includes one way and round trip searches as most of the reservations we encounter are one way or round trip flights. Round trip is chosen as the default for three reasons - based on the assumption that most people travelling to another city will return to their original city, that it is the default on most other sites, meaning that users are accustomed to this pattern, also to optimize the site for higher value bookings.
- We allow the user to enter city and airport names, but the list shown contains only airports so that the user can make a valid selection. In the list of airports displayed, each item shows the following, in order - City Name, State Code, Country Name, Airport Name, Airport Code. State codes and country names are displayed so that when multiple cities with the same name exist, the user can select the appropriate one
- We are exploring increasing the level of interaction between the origin and destination fields so that the user does not see in the destination field, the airport that has been selected in the origin field.
- Currently the level of interaction between the two calendar controls is minimum, however we are exploring to increase it by letting each control have knowledge of the others value - a common practice on most travel sites.
- We are also looking at introducing calendar controls where the user can scroll to view different months and drag to change the selection.
- We felt that steppers were more appropriate choices than dropdowns for selecting number of passengers, because steppers are ideal when small increment in values was required. For detailed reasoning see [this article](http://www.lukew.com/ff/entry.asp?1950).
- We display the passengers section upfront because having it hidden in a section disrupts the form completion flow, and increasing the height of the form doesn't have a high cost associated with it since scrolling is an easy interaction on mobile devices.
- Among the advanced search options, we chose to have only class of travel since we wanted to keep the basic design of this component simple. Letting the user filter by airline or number of stops is allowed along with other filtering options like price, once the results have loaded. This is done since all these filtering options are related, and to keep the length of the search form short.
