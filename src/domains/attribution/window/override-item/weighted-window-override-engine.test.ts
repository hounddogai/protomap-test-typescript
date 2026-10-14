import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedWindowOverrideEngine } from "./weighted-window-override-engine.js";
import { newWeightedWindowOverride } from "./weighted-window-override.js";

test("WeightedWindowOverrideEngine keeps results within bounds", () => {
  const engine = defaultWeightedWindowOverrideEngine(flags.newRegistry());
  const item = newWeightedWindowOverride("code-709", "label-449");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
