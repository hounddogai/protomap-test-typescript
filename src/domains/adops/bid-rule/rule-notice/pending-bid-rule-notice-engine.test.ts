import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingBidRuleNoticeEngine } from "./pending-bid-rule-notice-engine.js";
import { newPendingBidRuleNotice } from "./pending-bid-rule-notice.js";

test("PendingBidRuleNoticeEngine keeps results within bounds", () => {
  const engine = defaultPendingBidRuleNoticeEngine(flags.newRegistry());
  const item = newPendingBidRuleNotice("code-111", "title-416");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
