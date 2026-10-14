import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackNudgeNoticeEngine } from "./fallback-nudge-notice-engine.js";
import { newFallbackNudgeNotice } from "./fallback-nudge-notice.js";

test("FallbackNudgeNoticeEngine keeps results within bounds", () => {
  const engine = defaultFallbackNudgeNoticeEngine(flags.newRegistry());
  const item = newFallbackNudgeNotice("code-846", "title-187");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
