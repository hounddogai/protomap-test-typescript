import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBidRuleCheckpointEngine } from "./bid-rule-checkpoint-engine.js";
import { newBidRuleCheckpoint } from "./bid-rule-checkpoint.js";

test("BidRuleCheckpointEngine keeps results within bounds", () => {
  const engine = defaultBidRuleCheckpointEngine();
  const item = newBidRuleCheckpoint("code-484", "label-535");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
