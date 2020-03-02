export default target => {
  target.getTarget = ev => {
    const e = ev || window.event;
    return e.target || e.srcElement;
  };

  target.tplReplace = (template, replaceObject) => {
    return template().replace(/{{(.*?)}}/g, (node, key) => {
      return replaceObject[key];
    });
  };

  target.trimSpace = str => {
    return str.replace(/\s+/g, "");
  };

  target.throttle = (fn, delay) => {
    let t = null,
      beginTime = new Date().getTime();

    return function() {
      const _self = this,
        args = arguments,
        curTime = new Date().getTime();

      clearTimeout(t);

      if (curTime - beginTime >= delay) {
        fn.apply(_self, args);
        beginTime = curTime;
      } else {
        t = setTimeout(function() {
          fn.apply(_self, args);
        }, delay);
      }
    };
  };
};
