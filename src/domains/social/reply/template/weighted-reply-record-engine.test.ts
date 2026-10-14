import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWeightedReplyRecordEngine } from "./weighted-reply-record-engine.js";
import { newWeightedReplyRecord } from "./weighted-reply-record.js";

test("WeightedReplyRecordEngine keeps results within bounds", () => {
  const engine = defaultWeightedReplyRecordEngine();
  const item = newWeightedReplyRecord("code-795", "title-101");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
