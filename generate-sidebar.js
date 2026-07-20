import fs from "fs";

const input = "src/content/docs/sidebar.txt";
const output = "sidebar.config.js";

if (!fs.existsSync(input)) {
  console.log("❌ 找不到 sidebar.txt");
  process.exit(1);
}

const lines = fs.readFileSync(input, "utf8")
  .split("\n")
  .map(i => i.trim())
  .filter(Boolean);

// 按 "标签:目录" 切一段，只切第一个冒号
// 标签部分支持 "English|中文" 双语写法：默认语言 en 显示 "|" 前面的
// English，中文页面(zh-cn)则显示 "|" 后面的中文，通过 translations.zh-cn 提供。
// 如果不写 "|"，两种语言就都显示同一个 label（比如 "Android" 这种本来就中英一致的词）。
//
// 这里的 directory 是"语言文件夹内部"的相对路径，例如 "Android/HUAWEI" 会自动
// 匹配 src/content/docs/en/Android/HUAWEI 和 src/content/docs/zh-cn/Android/HUAWEI
// 两份目录 —— autogenerate 在多语言站点里本来就是按语言各自解析的，不需要在这里
// 写 en/ 或 zh-cn/ 前缀，也不需要脚本额外做"文件名匹配"：只要中英文两边用相同的
// 文件名，Starlight 就会自动把它们当作同一篇文章的两个语言版本关联起来，侧边栏里
// 的排序（默认按文件名字母顺序）自然也就一致了。
function splitLabelDir(segment, rawLine) {
  const colonIdx = segment.indexOf(":");

  if (colonIdx === -1) {
    throw new Error(`格式错误(缺少冒号): ${rawLine}`);
  }

  const rawLabel = segment.slice(0, colonIdx).trim();
  const directory = segment.slice(colonIdx + 1).trim();

  if (!rawLabel || !directory) {
    throw new Error(`格式错误: ${rawLine}`);
  }

  const pipeIdx = rawLabel.indexOf("|");
  const label = pipeIdx === -1 ? rawLabel : rawLabel.slice(0, pipeIdx).trim();
  const zhLabel = pipeIdx === -1 ? null : rawLabel.slice(pipeIdx + 1).trim();

  if (pipeIdx !== -1 && !zhLabel) {
    throw new Error(`格式错误(| 后面缺少中文标签): ${rawLine}`);
  }

  return { label, zhLabel, directory };
}

function withTranslations(entry, zhLabel) {
  if (zhLabel) {
    entry.translations = { "zh-cn": zhLabel };
  }
  return entry;
}

// 大分类 -> 子分类，用目录做去重 key（标签的双语写法在每一行都要写全，用目录更稳）
const groups = new Map();

// 没有父级分类，直接放顶层
const topLevel = [];

for (const line of lines) {
  const arrowIdx = line.indexOf(">");

  // 格式:
  // 标签:目录  或  English|中文:目录
  if (arrowIdx === -1) {
    const { label, zhLabel, directory } = splitLabelDir(line, line);

    topLevel.push(
      withTranslations(
        {
          label,
          items: [
            {
              autogenerate: {
                directory
              }
            }
          ]
        },
        zhLabel
      )
    );

    continue;
  }

  // 格式:
  // 大分类标签:大分类目录>子分类标签:子分类目录
  const parentPart = line.slice(0, arrowIdx).trim();
  const childPart = line.slice(arrowIdx + 1).trim();

  const parent = splitLabelDir(parentPart, line);
  const child = splitLabelDir(childPart, line);

  const key = parent.directory;

  if (!groups.has(key)) {
    groups.set(
      key,
      withTranslations(
        {
          label: parent.label,
          items: []
        },
        parent.zhLabel
      )
    );
  }

  groups.get(key).items.push(
    withTranslations(
      {
        label: child.label,
        items: [
          {
            autogenerate: {
              directory: `${parent.directory}/${child.directory}`
            }
          }
        ]
      },
      child.zhLabel
    )
  );
}

const sidebar = [
  ...groups.values(),
  ...topLevel
];

const content = `export default ${JSON.stringify(sidebar, null, 2)};\n`;

fs.writeFileSync(output, content, "utf8");

console.log("✅ sidebar.config.js 已生成");
