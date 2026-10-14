import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultGlobalMacroThresholdEngine } from "./global-macro-threshold-engine.js";
import { newGlobalMacroThreshold } from "./global-macro-threshold.js";

test("GlobalMacroThresholdEngine keeps results within bounds", () => {
  const engine = defaultGlobalMacroThresholdEngine();
  const item = newGlobalMacroThreshold("code-938", "title-17");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
