import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCappedQueueNoticeEngine } from "./capped-queue-notice-engine.js";
import { newCappedQueueNotice } from "./capped-queue-notice.js";

test("CappedQueueNoticeEngine keeps results within bounds", () => {
  const engine = defaultCappedQueueNoticeEngine(flags.newRegistry());
  const item = newCappedQueueNotice("code-187", "label-687");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
