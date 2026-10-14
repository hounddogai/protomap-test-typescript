import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRedemptionRecordEngine } from "./redemption-record-engine.js";
import { newRedemptionRecord } from "./redemption-record.js";

test("RedemptionRecordEngine keeps results within bounds", () => {
  const engine = defaultRedemptionRecordEngine();
  const item = newRedemptionRecord("code-967", "label-464");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
