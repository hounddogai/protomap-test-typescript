import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultManualFrequencyRequestEngine } from "./manual-frequency-request-engine.js";
import { newManualFrequencyRequest } from "./manual-frequency-request.js";

test("ManualFrequencyRequestEngine keeps results within bounds", () => {
  const engine = defaultManualFrequencyRequestEngine();
  const item = newManualFrequencyRequest("code-183", "name-861");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
