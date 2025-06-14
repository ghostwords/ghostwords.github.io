/* globals setup:true, update:true */

(function () {
  let canvas = document.createElement('canvas'),
    ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = document.documentElement.clientWidth;
    canvas.height = document.documentElement.clientHeight;
  }

  function _update(time) {
    if (typeof update != "undefined") {
      update(ctx, canvas.width, canvas.height, time);
    }
    requestAnimationFrame(_update);
  }

  window.addEventListener("load", function () {
    document.body.appendChild(canvas);

    resize();

    window.addEventListener("resize", function () {
      resize();
      if (typeof update != "undefined") {
        update(ctx, canvas.width, canvas.height, document.timeline.currentTime);
      }
    });

    if (typeof setup != "undefined") {
      setup(ctx, canvas.width, canvas.height);
    }

    requestAnimationFrame(_update);
  });
}());
