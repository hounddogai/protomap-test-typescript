import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedReplyClaimEngine } from "./batched-reply-claim-engine.js";
import { newBatchedReplyClaim } from "./batched-reply-claim.js";

test("BatchedReplyClaimEngine keeps results within bounds", () => {
  const engine = defaultBatchedReplyClaimEngine();
  const item = newBatchedReplyClaim("code-705", "label-111");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
