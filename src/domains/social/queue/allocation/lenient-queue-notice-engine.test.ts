import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLenientQueueNoticeEngine } from "./lenient-queue-notice-engine.js";
import { newLenientQueueNotice } from "./lenient-queue-notice.js";

test("LenientQueueNoticeEngine keeps results within bounds", () => {
  const engine = defaultLenientQueueNoticeEngine();
  const item = newLenientQueueNotice("code-73", "label-354");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
