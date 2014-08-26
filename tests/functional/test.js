define([
    'intern!object',
    'intern/assert',
    'require'
], function (registerSuite, assert, require) {
    registerSuite({
        name: 'expose',

//        LOADING DATA Tests:
        'expose Opens': function () {
            return this.get('remote')
                .get(require.toUrl('dist/index.html'))
                .setFindTimeout(2000)
                .findByClassName('exposeOpen')
                .click()
                .end()
                .setFindTimeout(3000)
                .findByClassName('expose-modules')
                .isDisplayed()
                .then(function (state) {
                    assert.ok(state,
                        'Expose modules should display');
                });
        }




    });
});
