const matchesStringOrRegExp = require("./utils/matchesStringOrRegExp");
const postcss = require("postcss");
const stylelint = require("stylelint");
const { report, ruleMessages, validateOptions } = stylelint.utils;

const ruleName = "plugin/declaration-block-no-ignored-properties";

const messages = ruleMessages(ruleName, {
  rejected: (ignore, cause) => `Unexpected "${ignore}" with "${cause}"`
});

const ignored = [
  {
    property: "display",
    value: "inline",
    ignoredProperties: [
      "width",
      "min-width",
      "max-width",
      "height",
      "min-height",
      "max-height",
      "margin",
      "margin-top",
      "margin-bottom",
      "overflow",
      "overflow-x",
      "overflow-y"
    ]
  },
  {
    property: "display",
    value: "list-item",
    ignoredProperties: ["vertical-align"]
  },
  {
    property: "display",
    value: "block",
    ignoredProperties: ["vertical-align"]
  },
  {
    property: "display",
    value: "flex",
    ignoredProperties: ["vertical-align"]
  },
  {
    property: "display",
    value: "table",
    ignoredProperties: ["vertical-align"]
  },
  {
    property: "display",
    value: "/^table-.*$/",
    ignoredProperties: [
      "margin",
      "margin-top",
      "margin-right",
      "margin-bottom",
      "margin-left"
    ]
  },
  {
    property: "display",
    value:
      "/^table-(row|row-group|column|column-group|header-group|footer-group|caption).*$/",
    ignoredProperties: ["vertical-align"]
  },
  {
    property: "display",
    value: "/^table-(row|row-group).*$/",
    ignoredProperties: ["width", "min-width", "max-width"]
  },
  {
    property: "display",
    value: "/^table-(column|column-group).*$/",
    ignoredProperties: ["height", "min-height", "max-height"]
  },
  {
    property: "float",
    value: "left",
    ignoredProperties: ["vertical-align"]
  },
  {
    property: "float",
    value: "right",
    ignoredProperties: ["vertical-align"]
  },
  {
    property: "position",
    value: "static",
    ignoredProperties: ["top", "right", "bottom", "left"]
  },
  {
    property: "position",
    value: "absolute",
    ignoredProperties: ["float", "clear", "vertical-align"]
  },
  {
    property: "position",
    value: "fixed",
    ignoredProperties: ["float", "clear", "vertical-align"]
  }
];

const rule = actual => {
  return (root, result) => {
    const validOptions = validateOptions(result, ruleName, { actual });

    if (!validOptions) {
      return;
    }

    const uniqueDecls = {};
    root.walkDecls(decl => {
      uniqueDecls[decl.prop] = decl;
    });

    Object.keys(uniqueDecls).forEach((prop, index) => {
      const decl = uniqueDecls[prop];
      const unprefixedProp = postcss.vendor.unprefixed(prop);
      const unprefixedValue = postcss.vendor.unprefixed(decl.value);

      ignored.forEach(ignore => {
        const matchProperty = matchesStringOrRegExp(
          unprefixedProp.toLowerCase(),
          ignore.property
        );
        const matchValue = matchesStringOrRegExp(
          unprefixedValue.toLowerCase(),
          ignore.value
        );

        if (!matchProperty || !matchValue) {
          return;
        }

        const ignoredProperties = ignore.ignoredProperties;

        decl.parent.nodes.forEach((node, nodeIndex) => {
          if (
            !node.prop ||
            ignoredProperties.indexOf(node.prop.toLowerCase()) === -1 ||
            index === nodeIndex
          ) {
            return;
          }

          report({
            message: messages.rejected(node.prop, decl.toString()),
            node,
            result,
            ruleName
          });
        });
      });
    });
  };
};

module.exports = stylelint.createPlugin(ruleName, rule);
module.exports.ruleName = ruleName;
module.exports.messages = messages;
