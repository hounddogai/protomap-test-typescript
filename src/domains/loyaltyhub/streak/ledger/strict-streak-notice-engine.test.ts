import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStrictStreakNoticeEngine } from "./strict-streak-notice-engine.js";
import { newStrictStreakNotice } from "./strict-streak-notice.js";

test("StrictStreakNoticeEngine keeps results within bounds", () => {
  const engine = defaultStrictStreakNoticeEngine();
  const item = newStrictStreakNotice("code-708", "label-296");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
