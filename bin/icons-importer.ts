import * as fs from "fs";

console.log("Running assets and icons importer");

const rawDirIcons = "svgs";
const exportDir = "lib_ex/moon";

const getFilesList = () =>
  fs.readdirSync(`${rawDirIcons}`).filter((x) => !x.includes(".gz"));

const toCamel = (s: string) => {
  return s.replace(/([-_][a-z])/gi, ($1) => {
    return $1
      .toUpperCase()
      .replace(/([-_])/gi, "")
      .replace(/([-_])/gi, "");
  });
};

const caseInsensitiveCompare = (a: string, b: string) =>
  a.toLowerCase().localeCompare(b.toLowerCase());

const capitalizeFirstLetter = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

const getModuleName = (s: string) =>
  capitalizeFirstLetter(toCamel(s))
    .replace("IconLoyalty-0", "IconLoyalty0")
    .replace(".svg", "");

const propsMap = `
  prop click, :event
  prop class, :css_class
  
  # All the other props below are deprecated!
  # Please use only tailwind classes and the class prop
  prop font_size, :string
  prop color, :string, values: MoonIcons.colors
  prop background_color, :string, values: MoonIcons.colors
  
`;

const propsMapKeys = [
  "color",
  "background_color",
  "font_size",
  "click",
  "class",
];

type WriteAssetsMapFileProps = {
  files: string[];
  groups: { [key: string]: string[] };
};

const getIconName = (s: string) =>
  s.replace(/([-_])/gi, "_").replace(".svg", "");

const writeAssetsMapFile = ({ files }: WriteAssetsMapFileProps) => {
  const newFilePath = `${exportDir}_icons/helpers/icons.ex`;

  const groupsCodeTemp: { names: string[]; code: string } = {
    names: [],
    code: "",
  };

  const groupsCode: { names: string[]; code: string } = Object.keys(
    groups
  ).reduce((accumulator, currentValue) => {
    let code = `def list_${currentValue} do
        ~w(
          ${groups[currentValue].sort().join("\n          ")}
        )
      end
    `;
    accumulator.code = `${accumulator.code} ${code}`;
    accumulator.names.push(currentValue);
    return accumulator;
  }, groupsCodeTemp);
  const contents = `# Do not edit this file
# This file is autogenerated by icon-importer.ts
    
defmodule Moon.Helpers.Icons do
@moduledoc false

    @group_names ~w(
      ${groupsCode.names.sort().join("\n      ")}
    ) 

    def group_names, do: @group_names

    def list_all do
      ~w(
        ${files
          .sort()
          .map((i) => getIconName(i))
          .join("\n         ")}
      )
    end
    ${groupsCode.code}
  end
  `;
  fs.writeFileSync(newFilePath, contents);
};

type CreateAssetsComponentFileProps = {
  file: string;
};

const createAssetComponentFile = ({ file }: CreateAssetsComponentFileProps) => {
  const newFilePath = `${exportDir}/icons/${file
    .replace(/([-_])/gi, "_")
    .toLowerCase()}.ex`;

  const svgMap = `
    <svg class={
        "moon-icon",
        @class,
        "text-#{@color}": @color,
        "bg-#{@background_color}": @background_color,
        "text-#{@font_size}": @font_size,
        "cursor-pointer": @click
      } :on-click={@click} style={get_style(color: @color, background_color: @background_color, font_size: @font_size)}>
      <use href="/moon_icons/svgs/icons_new/${file}.svg#item"></use>
    </svg>
  `;

  fs.writeFileSync(
    newFilePath,
    `
defmodule Moon.Icons.${getModuleName(file)} do
  @moduledoc false
  use MoonIcons.StatelessComponent
  ${propsMap}
  def render(assigns) do
    ~F"""
    ${svgMap}
    """
  end
end
`.replace("IconLoyalty-0", "IconLoyalty0")
  );
};

const singularMap = { currencies: "currency" };

const singularName = (pluralName: string) =>
  (singularMap as any)[pluralName] ||
  pluralName.substring(0, pluralName.length - 1);

const files = getFilesList();

if (fs.existsSync(`${exportDir}/helpers/icons.ex`)) {
  fs.unlinkSync(`${exportDir}/helpers/icons.ex`);
}

const groups = files.reduce(
  (accumulator: { [key: string]: string[] }, currentValue: string) => {
    const split = currentValue.split("-");
    const group = split[0];
    if (!accumulator[group]) {
      accumulator[group] = [];
    }
    accumulator[group].push(getIconName(currentValue));
    return accumulator;
  },
  {}
);

writeAssetsMapFile({
  files,
  groups,
});

files.map((file: string) => {
  createAssetComponentFile({
    file: file.replace(".svg", ""),
  });
});
