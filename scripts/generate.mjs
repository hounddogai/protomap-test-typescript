/** Compile every vendored API with the same wire options as the platform's own APIs. */
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

function protos(directory) {
  return readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, "en")).flatMap(
    (entry) => entry.isDirectory() ? protos(join(directory, entry.name)) :
      entry.name.endsWith(".proto") ? [join(directory, entry.name).slice("proto/".length)] : [],
  );
}

const version = execFileSync("protoc", ["--version"], { encoding: "utf8" }).trim();
if (version !== "libprotoc 36.2") throw new Error(`Expected protoc 36.2; found ${version}`);
rmSync(".cache/proto", { recursive: true, force: true });
mkdirSync(".cache/proto", { recursive: true });
const files = protos("proto");
// Batches bound the plugin's memory without changing any generated file's contents.
for (let offset = 0; offset < files.length; offset += 60) {
  execFileSync("protoc", [
    "-Iproto", "--plugin=protoc-gen-ts_proto=node_modules/.bin/protoc-gen-ts_proto",
    "--ts_proto_out=.cache/proto",
    "--ts_proto_opt=outputServices=grpc-js,oneof=unions,esModuleInterop=true,env=node,importSuffix=.js,useDate=false",
    ...files.slice(offset, offset + 60),
  ], { stdio: "inherit" });
}
console.info(`Compiled ${files.length} protobuf files into .cache/proto`);
