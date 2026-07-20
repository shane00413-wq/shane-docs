import fs from "fs";
import path from "path";
import readline from "readline";

const DOC_ROOT = "src/content/docs";
const IMG_ROOT = "public/img";


function clean(value) {
  return value?.trim() || "";
}


// YAML 安全
function yaml(value) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll('"', '\\"')
    .replaceAll("\n", " ");
}


// 文件名检查
function checkFilename(filename) {

  const invalid = /[\\/:*?"<>|]/;

  if (
    invalid.test(filename) ||
    filename.includes("..")
  ) {
    throw new Error(
      "文件名包含非法字符"
    );
  }

}


// 目录检查（防止 directory 参数本身携带 .. 或非法字符逃逸出 docs 目录）
// 目录允许用 "/" 分隔子目录，所以校验字符集时不能把 "/" 当非法字符
function checkDirectory(directory) {

  const invalidInSegment = /[\\:*?"<>|]/;

  if (
    invalidInSegment.test(directory) ||
    directory.includes("..")
  ) {
    throw new Error(
      "目录包含非法字符"
    );
  }

}


// 路径安全
function checkPath(directory, filename) {

  const target = path.resolve(
    DOC_ROOT,
    directory,
    filename
  );


  const root = path.resolve(
    DOC_ROOT
  );


  if (
    target !== root &&
    !target.startsWith(root + path.sep)
  ) {
    throw new Error(
      "非法路径，不能离开 docs 目录"
    );
  }

}



function createDoc({
  directory,
  filename,
  title = "",
  description = "",
  order = "",
  useMdx = false
}) {


  checkFilename(filename);
  checkDirectory(directory);


  if (!filename.endsWith(".md") && !filename.endsWith(".mdx")) {
    filename += useMdx ? ".mdx" : ".md";
  }


  checkPath(
    directory,
    filename
  );


  const dir = path.join(
    DOC_ROOT,
    directory
  );


  const filePath = path.join(
    dir,
    filename
  );


  if (fs.existsSync(filePath)) {
    throw new Error(
      "文件已经存在"
    );
  }


  fs.mkdirSync(dir, {
    recursive: true
  });



  let content = "---\n";


  if (title) {
    content += `title: "${yaml(title)}"\n`;
  }


  if (description) {
    content += `description: "${yaml(description)}"\n`;
  }


  if (order) {
    content +=
`sidebar:
  order: ${order}
`;
  }


  content +=
`---

# ${title}
`;


  fs.writeFileSync(
    filePath,
    content,
    "utf8"
  );


  // 顺手建好配图文件夹 用文件名(不含扩展名)命名 和博客那边的习惯保持一致
  const imgDirName = filename.replace(/\.mdx?$/, "");
  const imgDir = path.join(IMG_ROOT, imgDirName);

  if (!fs.existsSync(imgDir)) {
    fs.mkdirSync(imgDir, { recursive: true });
  }


  console.log("\n✅ 创建成功:");
  console.log(filePath);
  console.log(`📁 配图文件夹: ${imgDir}`);
}



// =================
// 命令模式
// =================

function commandMode(args) {

  let directory = "";
  let filename = "";
  let title = "";
  let description = "";
  let order = "";
  let useMdx = false;


  for (
    let i = 0;
    i < args.length;
    i++
  ) {

    switch(args[i]) {

      case "--dir":
        directory = args[++i] || "";
        break;


      case "--file":
        filename = args[++i] || "";
        break;


      case "--title":
        title = args[++i] || "";
        break;


      case "--description":
        description = args[++i] || "";
        break;


      case "--order":
        order = args[++i] || "";
        break;


      case "--mdx":
        useMdx = true;
        break;

    }

  }


  if (!directory || !filename) {

    console.log(`
用法:

pnpm new-doc --dir <目录> --file <文件名>

可选:

--title "标题"
--description "描述"
--order 数字
--mdx
`);

    process.exit(1);
  }


  try {

    createDoc({
      directory,
      filename,
      title,
      description,
      order,
      useMdx
    });

  } catch(error) {

    console.log(
      "❌ " + error.message
    );

    process.exit(1);

  }

}



// =================
// 问答模式
// =================

async function interactiveMode() {


  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });



  const ask = (text) =>
    new Promise(resolve => {

      rl.question(
        text,
        answer => {
          resolve(clean(answer));
        }
      );

    });



  console.log(
    "📄 Astro Starlight 新建文档\n"
  );



  let directory = "";

  while(!directory) {

    directory = await ask(
      "目录: "
    );

  }



  let filename = "";

  while(!filename) {

    filename = await ask(
      "文件名: "
    );


    try {

      checkFilename(filename);

    } catch(error) {

      console.log(
        "❌ " + error.message
      );

      filename = "";

    }

  }



  const title = await ask(
    "标题(空格跳过): "
  );


  const order = await ask(
    "排序(空格跳过): "
  );


  const description = await ask(
    "描述(空格跳过): "
  );


  const mdxInput = await ask(
    "是否启用 mdx? (y/N): "
  );


  rl.close();


  const useMdx = /^y(es)?$/i.test(mdxInput);



  try {

    createDoc({
      directory,
      filename,
      title,
      description,
      order,
      useMdx
    });


  } catch(error) {

    console.log(
      "❌ " + error.message
    );

  }

}



// =================
// 启动
// =================

const args = process.argv.slice(2);


if (
  args.includes("--dir") ||
  args.includes("--file")
) {

  commandMode(args);

} else {

  interactiveMode();

}