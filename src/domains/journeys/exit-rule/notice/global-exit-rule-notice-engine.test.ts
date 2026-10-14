import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultGlobalExitRuleNoticeEngine } from "./global-exit-rule-notice-engine.js";
import { newGlobalExitRuleNotice } from "./global-exit-rule-notice.js";

test("GlobalExitRuleNoticeEngine keeps results within bounds", () => {
  const engine = defaultGlobalExitRuleNoticeEngine();
  const item = newGlobalExitRuleNotice("code-334", "title-984");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
