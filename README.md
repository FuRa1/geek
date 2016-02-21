# Geek task
This is angularJS based webApp, which was made for test task https://github.com/geeksteam/VcFrontendTest.
## Running:
you will need pre-installed `npm`
to run application - execute following command at the root folder
```bash
npm start
```
then open in browser http://localhost:8000/
## Testing:
to run unit test - execute following command at the root folder
```bash
npm test
```
### Test descriptions:
Test 1 verifies that when respond content is {'Auth':'Logged'}, webApp will move to `\success` state  with correct template.

Test 2 verifies that when respond content is {'Auth':'HOTP required'}, webApp will move to `\hotp` state  with correct template.

Test 3 verifies that when respond content is {'Auth':'HOTP wrong code'}, webApp will mark input in red by adding `Error` class.

Test 4 verifies that when respond content is {'Auth':'Banned','Time': '10'}, webApp will disable login button for 10 sec. 
