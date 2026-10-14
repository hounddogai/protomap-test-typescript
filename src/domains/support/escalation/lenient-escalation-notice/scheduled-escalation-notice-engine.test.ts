import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultScheduledEscalationNoticeEngine } from "./scheduled-escalation-notice-engine.js";
import { newScheduledEscalationNotice } from "./scheduled-escalation-notice.js";

test("ScheduledEscalationNoticeEngine keeps results within bounds", () => {
  const engine = defaultScheduledEscalationNoticeEngine();
  const item = newScheduledEscalationNotice("code-313", "label-498");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
