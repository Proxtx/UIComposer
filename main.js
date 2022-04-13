const updateParsedHtml = (options) => {
  supplementParsedHtml(options.htmlList, options.pack);
  options.initResolve = [];
  let buildHtml = options.libs.build(options.htmlList);
  let wrap = document.createElement("div");
  for (let i of buildHtml) wrap.appendChild(i);
  for (let componentElement of wrap.getElementsByClassName("component"))
    generateComponent(componentElement, options);
  Promise.all(options.initResolve).then(() => {
    options.init && options.init();
  });
  return wrap;
};

const generateComponent = (componentElem, options) => {
  let attributes = { element: null };
  componentElem
    .getAttributeNames()
    .forEach(
      (value) => (attributes[value] = componentElem.getAttribute(value))
    );
  let component = options.libs.load(componentElem.getAttribute("src"))(
    attributes
  );
  for (let i of Object.keys(attributes))
    component.element.setAttribute(i, attributes[i]);
  attributes.element = componentElem;
  component.element.setAttribute("class", "");
  component.element.component = component;
  componentElem.parentElement.replaceChild(component.element, componentElem);
  options.initResolve.push(new Promise((r) => component.init(r)));

  component.load(async () => {
    let doc = component.element.contentDocument;
    let initResolver;
    let componentWrap = doc.getElementById("componentWrap");
    let updatedHtml = updateHtml({
      html: componentWrap.innerHTML,
      pack: options.pack,
      libs: options.libs,
      init: () => {
        initResolver();
      },
    });

    for (let i of componentWrap.childNodes) {
      componentWrap.removeChild(i);
    }
    for (let i of updatedHtml.childNodes) {
      componentWrap.appendChild(i);
    }
    await new Promise((r) => (initResolver = r));
  });
};

const supplementParsedHtml = (htmlList, pack) => {
  for (let i in htmlList) {
    if (htmlList[i].type != "html") continue;
    supplementParsedHtml(htmlList[i].innerHTML, pack);
    let componentIndex = Object.keys(pack.components).indexOf(htmlList[i].tag);
    if (componentIndex <= -1) continue;
    htmlList[i] = {
      type: "html",
      tag: "div",
      innerHTML: htmlList[i].innerHTML,
      attributes: [
        { attribute: "class", value: "component" },
        {
          attribute: "src",
          value: pack.defaultSrc
            ? pack.defaultSrc + pack.components[htmlList[i].tag].src
            : pack.components[htmlList[i].tag].src,
        },
        ...htmlList[i].attributes,
      ],
    };
  }
};

export const updateHtml = (options) => {
  let htmlParser = new options.libs.Parser();
  for (let i of Object.keys(options.pack.components))
    if (options.pack.components[i].selfClosing)
      htmlParser.selfClosingTags.push(i.toLowerCase());

  options.htmlList = htmlParser.parse(options.html);

  return updateParsedHtml(options);
};
