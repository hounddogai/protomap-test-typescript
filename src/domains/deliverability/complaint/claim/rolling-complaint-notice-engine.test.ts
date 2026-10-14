import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRollingComplaintNoticeEngine } from "./rolling-complaint-notice-engine.js";
import { newRollingComplaintNotice } from "./rolling-complaint-notice.js";

test("RollingComplaintNoticeEngine keeps results within bounds", () => {
  const engine = defaultRollingComplaintNoticeEngine();
  const item = newRollingComplaintNotice("code-427", "title-83");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
