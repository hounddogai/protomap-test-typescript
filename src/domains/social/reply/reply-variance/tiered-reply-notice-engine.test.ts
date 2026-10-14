import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredReplyNoticeEngine } from "./tiered-reply-notice-engine.js";
import { newTieredReplyNotice } from "./tiered-reply-notice.js";

test("TieredReplyNoticeEngine keeps results within bounds", () => {
  const engine = defaultTieredReplyNoticeEngine(flags.newRegistry());
  const item = newTieredReplyNotice("code-964", "label-342");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
