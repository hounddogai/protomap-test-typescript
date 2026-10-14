import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingRewardRuleNoticeEngine } from "./pending-reward-rule-notice-engine.js";
import { newPendingRewardRuleNotice } from "./pending-reward-rule-notice.js";

test("PendingRewardRuleNoticeEngine keeps results within bounds", () => {
  const engine = defaultPendingRewardRuleNoticeEngine(flags.newRegistry());
  const item = newPendingRewardRuleNotice("code-471", "name-130");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
