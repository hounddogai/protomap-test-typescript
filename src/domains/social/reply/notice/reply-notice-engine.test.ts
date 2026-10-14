import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultReplyNoticeEngine } from "./reply-notice-engine.js";
import { newReplyNotice } from "./reply-notice.js";

test("ReplyNoticeEngine keeps results within bounds", () => {
  const engine = defaultReplyNoticeEngine(flags.newRegistry());
  const item = newReplyNotice("code-269", "label-385");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
