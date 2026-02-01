(function () {
  var header = document.querySelector('.dr-header');
  if (!header) return;

  var burger = header.querySelector('.dr-header-burger');
  var nav = header.querySelector('.dr-nav');
  var inner = header.querySelector('.dr-header-inner');

  if (!burger || !nav || !inner) return;

  burger.addEventListener('click', function () {
    var expanded = burger.getAttribute('aria-expanded') === 'true';
    var nextState = !expanded;
    burger.setAttribute('aria-expanded', String(nextState));

    if (nextState) {
      inner.classList.add('dr-header-open');
    } else {
      inner.classList.remove('dr-header-open');
    }
  });
})();
