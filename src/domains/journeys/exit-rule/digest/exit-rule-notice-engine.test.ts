import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultExitRuleNoticeEngine } from "./exit-rule-notice-engine.js";
import { newExitRuleNotice } from "./exit-rule-notice.js";

test("ExitRuleNoticeEngine keeps results within bounds", () => {
  const engine = defaultExitRuleNoticeEngine(flags.newRegistry());
  const item = newExitRuleNotice("code-160", "label-951");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
