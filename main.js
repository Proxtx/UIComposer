export const updateParsedHtml = async (htmlList, pack, build, load, Parser) => {
  supplementParsedHtml(htmlList, pack);
  let buildHtml = build(htmlList);
  let wrap = document.createElement("div");
  for (let i of buildHtml) wrap.appendChild(i);
  for (let t of wrap.getElementsByClassName("component")) {
    let attributes = {};
    t.getAttributeNames().forEach(
      (value) => (attributes[value] = t.getAttribute(value))
    );
    let component = await load(t.getAttribute("src"))(attributes);
    component.load().then(async () => {
      let updatedHtml = await updateHtml(
        component.element.contentDocument.body.innerHTML,
        Parser,
        pack,
        build,
        load
      );
      for (let i of component.element.contentDocument.body.children) {
        component.element.contentDocument.body.removeChild(i);
      }
      component.element.contentDocument.body.appendChild(updatedHtml);
    });
    component.load().then(
      () =>
        (component.element.contentWindow.composer = {
          updateParsedHtml,
          updateHtml,
          pack,
          build,
          load,
          Parser,
        })
    );
    t.parentElement.replaceChild(component.element, t);
  }

  return wrap;
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

export const updateHtml = async (html, Parser, pack, build, load) => {
  let htmlParser = new Parser();
  for (let i in pack.components) {
    if (!pack.components[i].needsClosingTag)
      htmlParser.selfClosingTags.push(i.toLowerCase());
  }

  let parsedHtml = htmlParser.parse(html);

  let buildHtml = await updateParsedHtml(parsedHtml, pack, build, load, Parser);

  return buildHtml;
};
