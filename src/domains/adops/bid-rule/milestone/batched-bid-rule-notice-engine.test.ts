import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedBidRuleNoticeEngine } from "./batched-bid-rule-notice-engine.js";
import { newBatchedBidRuleNotice } from "./batched-bid-rule-notice.js";

test("BatchedBidRuleNoticeEngine keeps results within bounds", () => {
  const engine = defaultBatchedBidRuleNoticeEngine(flags.newRegistry());
  const item = newBatchedBidRuleNotice("code-226", "title-20");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
