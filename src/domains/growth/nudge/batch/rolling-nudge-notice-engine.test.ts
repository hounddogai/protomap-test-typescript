import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingNudgeNoticeEngine } from "./rolling-nudge-notice-engine.js";
import { newRollingNudgeNotice } from "./rolling-nudge-notice.js";

test("RollingNudgeNoticeEngine keeps results within bounds", () => {
  const engine = defaultRollingNudgeNoticeEngine(flags.newRegistry());
  const item = newRollingNudgeNotice("code-64", "title-853");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
