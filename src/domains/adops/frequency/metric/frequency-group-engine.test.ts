import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFrequencyGroupEngine } from "./frequency-group-engine.js";
import { newFrequencyGroup } from "./frequency-group.js";

test("FrequencyGroupEngine keeps results within bounds", () => {
  const engine = defaultFrequencyGroupEngine();
  const item = newFrequencyGroup("code-869", "label-883");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
