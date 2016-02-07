# Palindrome task
This libruary - is an angular factory, which exports `parcer` function that takes a **string** value end returns an array with the palindromes sorted by length.
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
Test 1 verifies that function returns an empty array, string value is `123` without palindromes.

Test 2 verifies that function returns an array, where there first element will be `abxyzyxba`, string value  is `yabxyzyxba1`.

Test 3 verifies that function returns an array of four elements, string value is `yabxyzyxba1`.

Test 4 verifies that function returns an array where the length of the first element greater than the second, string value is `yabxyzyxba1`.
