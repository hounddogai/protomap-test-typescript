import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientStreakNoticeEngine } from "./lenient-streak-notice-engine.js";
import { newLenientStreakNotice } from "./lenient-streak-notice.js";

test("LenientStreakNoticeEngine keeps results within bounds", () => {
  const engine = defaultLenientStreakNoticeEngine(flags.newRegistry());
  const item = newLenientStreakNotice("code-49", "title-604");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
