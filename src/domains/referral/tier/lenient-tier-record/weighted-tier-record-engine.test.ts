import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWeightedTierRecordEngine } from "./weighted-tier-record-engine.js";
import { newWeightedTierRecord } from "./weighted-tier-record.js";

test("WeightedTierRecordEngine keeps results within bounds", () => {
  const engine = defaultWeightedTierRecordEngine();
  const item = newWeightedTierRecord("code-557", "name-184");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
