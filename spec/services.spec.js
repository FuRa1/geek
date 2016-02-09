describe('servicesTest', function () {
    var services;

    beforeEach(function () {
        module('testApp');
    });

    beforeEach(inject(function ($injector) {
        parser = $injector.get('services');
    }));

    it('is there are no palindromes, should return an empty array', function () {
        var result = parser("123");

        expect(result).toBeEmptyArray();

    });

    it('with "yabxyzyxba1" value, result should return an array, firs elm of it will be "abxyzyxba"', function () {
        var result = parser('yabxyzyxba1');

        expect(result[0]).toBe("abxyzyxba");
    });

    it('with "yabxyzyxba1" value, result should contain 4 palindromes', function () {
        var result = parser('yabxyzyxba1');

        expect(result.length).toBe(4);
    });

    it('firs element should have maximal length', function () {
        var result = parser('yabxyzyxba1');

        expect(result[0].length > result[1].length).toBe(true);
    });

});