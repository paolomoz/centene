// Interaction parity (probed live 2026-08-26): hamburger slides the drawer
// and search wrapper from left:-100% to 0; drawer chevrons expand submenus.
// Desktop nav has no submenu interaction on live (hover = underline only).
document.querySelectorAll('.nav-toggle').forEach(function (btn) {
  btn.addEventListener('click', function () {
    document.querySelector('.nav-wrapper').classList.toggle('drawer-open');
    var open = document.querySelector('.nav-wrapper').classList.contains('drawer-open');
    document.querySelectorAll('.nav-toggle').forEach(function (b) { b.setAttribute('aria-expanded', open); });
  });
});
document.querySelectorAll('.dropdown-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var ul = btn.parentElement.querySelector('ul');
    if (ul) ul.classList.toggle('submenu-open');
  });
});
