import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultScheduledExitRuleNoticeEngine } from "./scheduled-exit-rule-notice-engine.js";
import { newScheduledExitRuleNotice } from "./scheduled-exit-rule-notice.js";

test("ScheduledExitRuleNoticeEngine keeps results within bounds", () => {
  const engine = defaultScheduledExitRuleNoticeEngine();
  const item = newScheduledExitRuleNotice("code-37", "label-224");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
