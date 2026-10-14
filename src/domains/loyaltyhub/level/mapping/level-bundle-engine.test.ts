import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLevelBundleEngine } from "./level-bundle-engine.js";
import { newLevelBundle } from "./level-bundle.js";

test("LevelBundleEngine keeps results within bounds", () => {
  const engine = defaultLevelBundleEngine(flags.newRegistry());
  const item = newLevelBundle("code-696", "title-927");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
