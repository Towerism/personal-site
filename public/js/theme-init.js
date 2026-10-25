// Runs before first paint (blocking, in <head>): marks JS as available and
// applies a stored theme and motion choice so the page never flashes the
// wrong theme or starts motion the visitor paused.
(function () {
  var root = document.documentElement;
  root.classList.add('js');
  try {
    var theme = localStorage.getItem('theme');
    if (theme === 'light' || theme === 'dark') root.dataset.theme = theme;
    if (localStorage.getItem('motion') === 'paused') root.classList.add('motion-paused');
  } catch {
    // Storage blocked: follow the system theme and keep motion on.
  }
})();
