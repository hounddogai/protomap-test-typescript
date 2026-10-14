import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedEscalationNoticeEngine } from "./batched-escalation-notice-engine.js";
import { newBatchedEscalationNotice } from "./batched-escalation-notice.js";

test("BatchedEscalationNoticeEngine keeps results within bounds", () => {
  const engine = defaultBatchedEscalationNoticeEngine();
  const item = newBatchedEscalationNotice("code-744", "label-879");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
