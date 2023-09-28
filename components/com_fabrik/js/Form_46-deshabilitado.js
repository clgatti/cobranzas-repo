requirejs(['fab/fabrik'], function () {
   Fabrik.addEvent('fabrik.form.loaded', function (form) {
      form.mockSubmit();
   });
});