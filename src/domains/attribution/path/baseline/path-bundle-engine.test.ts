import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPathBundleEngine } from "./path-bundle-engine.js";
import { newPathBundle } from "./path-bundle.js";

test("PathBundleEngine keeps results within bounds", () => {
  const engine = defaultPathBundleEngine(flags.newRegistry());
  const item = newPathBundle("code-848", "title-433");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
