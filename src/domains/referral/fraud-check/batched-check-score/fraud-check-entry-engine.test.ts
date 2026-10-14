import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFraudCheckEntryEngine } from "./fraud-check-entry-engine.js";
import { newFraudCheckEntry } from "./fraud-check-entry.js";

test("FraudCheckEntryEngine keeps results within bounds", () => {
  const engine = defaultFraudCheckEntryEngine();
  const item = newFraudCheckEntry("code-58", "label-308");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
