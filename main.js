export const updateParsedHtml = (htmlList, pack) => {
  for (let i in htmlList) {
    if (htmlList[i].type != "html") continue;
    updateParsedHtml(htmlList[i].innerHTML, pack);
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

export const updateHtml = (html, Parser, pack) => {
  let htmlParser = new Parser();
  for (let i in pack.components) {
    if (!pack.components[i].needsClosingTag)
      htmlParser.selfClosingTags.push(i.toLowerCase());
  }

  let parsedHtml = htmlParser.parse(html);

  updateParsedHtml(parsedHtml, pack);

  return parsedHtml;
};
