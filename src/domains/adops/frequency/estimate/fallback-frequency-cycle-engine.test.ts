import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackFrequencyCycleEngine } from "./fallback-frequency-cycle-engine.js";
import { newFallbackFrequencyCycle } from "./fallback-frequency-cycle.js";

test("FallbackFrequencyCycleEngine keeps results within bounds", () => {
  const engine = defaultFallbackFrequencyCycleEngine(flags.newRegistry());
  const item = newFallbackFrequencyCycle("code-479", "label-585");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
