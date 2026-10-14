import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStreakNoticeEngine } from "./streak-notice-engine.js";
import { newStreakNotice } from "./streak-notice.js";

test("StreakNoticeEngine keeps results within bounds", () => {
  const engine = defaultStreakNoticeEngine();
  const item = newStreakNotice("code-421", "title-197");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
