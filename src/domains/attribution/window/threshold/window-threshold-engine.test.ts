import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWindowThresholdEngine } from "./window-threshold-engine.js";
import { newWindowThreshold } from "./window-threshold.js";

test("WindowThresholdEngine keeps results within bounds", () => {
  const engine = defaultWindowThresholdEngine(flags.newRegistry());
  const item = newWindowThreshold("code-29", "title-318");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
