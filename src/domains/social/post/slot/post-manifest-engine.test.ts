import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPostManifestEngine } from "./post-manifest-engine.js";
import { newPostManifest } from "./post-manifest.js";

test("PostManifestEngine keeps results within bounds", () => {
  const engine = defaultPostManifestEngine(flags.newRegistry());
  const item = newPostManifest("code-465", "title-923");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
