import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(__dirname, "..");
const distRoot = resolve(backendRoot, "dist");

function copyDirectory(sourceRelativePath, targetRelativePath) {
  const sourcePath = resolve(backendRoot, sourceRelativePath);
  const targetPath = resolve(backendRoot, targetRelativePath);

  if (!existsSync(sourcePath)) {
    throw new Error(`directory not found: ${sourcePath}`);
  }

  rmSync(targetPath, { recursive: true, force: true });
  mkdirSync(dirname(targetPath), { recursive: true });
  cpSync(sourcePath, targetPath, { recursive: true });
}

function rewriteImports(value) {
  if (typeof value === "string") {
    return value.replace("./src/", "./");
  }

  if (Array.isArray(value)) {
    return value.map(rewriteImports);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [key, rewriteImports(entryValue)]),
    );
  }

  return value;
}

function writeDistPackageJson() {
  const sourcePackageJsonPath = resolve(backendRoot, "package.json");

  if (!existsSync(sourcePackageJsonPath)) {
    throw new Error(`package.json not found: ${sourcePackageJsonPath}`);
  }

  const sourcePackageJson = JSON.parse(readFileSync(sourcePackageJsonPath, "utf8"));
  const distPackageJson = {
    name: sourcePackageJson.name,
    version: sourcePackageJson.version,
    type: sourcePackageJson.type,
    imports: rewriteImports(sourcePackageJson.imports ?? {}),
    dependencies: sourcePackageJson.dependencies ?? {},
  };

  mkdirSync(distRoot, { recursive: true });
  writeFileSync(
    resolve(distRoot, "package.json"),
    `${JSON.stringify(distPackageJson, null, 2)}\n`,
    "utf8",
  );
}

copyDirectory("driver", "dist/driver");
copyDirectory("sql", "dist/sql");
writeDistPackageJson();
