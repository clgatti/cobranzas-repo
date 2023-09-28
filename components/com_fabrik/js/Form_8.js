jQuery(document).ready(function() {
  window.addEventListener("keyup", function(event) {
    event.preventDefault();
  if (event.keyCode === 13) {
    document.getElementById("fabrikSubmit_8").click();
  }
  })
});