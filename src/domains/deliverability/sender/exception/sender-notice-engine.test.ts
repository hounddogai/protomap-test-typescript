import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSenderNoticeEngine } from "./sender-notice-engine.js";
import { newSenderNotice } from "./sender-notice.js";

test("SenderNoticeEngine keeps results within bounds", () => {
  const engine = defaultSenderNoticeEngine(flags.newRegistry());
  const item = newSenderNotice("code-884", "title-99");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
