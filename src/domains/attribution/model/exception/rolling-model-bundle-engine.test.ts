import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingModelBundleEngine } from "./rolling-model-bundle-engine.js";
import { newRollingModelBundle } from "./rolling-model-bundle.js";

test("RollingModelBundleEngine keeps results within bounds", () => {
  const engine = defaultRollingModelBundleEngine(flags.newRegistry());
  const item = newRollingModelBundle("code-455", "label-161");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
