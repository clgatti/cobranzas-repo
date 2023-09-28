jQuery(document).ready(function() {
  window.addEventListener("keyup", function(event) {
    event.preventDefault();
  if (event.keyCode === 13) {
     var up_forms = document.getElementsByName("apply");
     console.log(up_forms[0].name); // returns "FORM"    
     document.getElementsByName("apply")[0].click();
  }
  })
});