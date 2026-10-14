import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultNudgeNoticeEngine } from "./nudge-notice-engine.js";
import { newNudgeNotice } from "./nudge-notice.js";

test("NudgeNoticeEngine keeps results within bounds", () => {
  const engine = defaultNudgeNoticeEngine();
  const item = newNudgeNotice("code-611", "title-993");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
