import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveBounceNoticeEngine } from "./adaptive-bounce-notice-engine.js";
import { newAdaptiveBounceNotice } from "./adaptive-bounce-notice.js";

test("AdaptiveBounceNoticeEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveBounceNoticeEngine(flags.newRegistry());
  const item = newAdaptiveBounceNotice("code-849", "name-951");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
