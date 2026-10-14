import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultScheduledFrequencyNoticeEngine } from "./scheduled-frequency-notice-engine.js";
import { newScheduledFrequencyNotice } from "./scheduled-frequency-notice.js";

test("ScheduledFrequencyNoticeEngine keeps results within bounds", () => {
  const engine = defaultScheduledFrequencyNoticeEngine();
  const item = newScheduledFrequencyNotice("code-600", "label-600");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
