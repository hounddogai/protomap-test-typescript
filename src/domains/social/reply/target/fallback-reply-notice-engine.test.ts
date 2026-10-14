import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackReplyNoticeEngine } from "./fallback-reply-notice-engine.js";
import { newFallbackReplyNotice } from "./fallback-reply-notice.js";

test("FallbackReplyNoticeEngine keeps results within bounds", () => {
  const engine = defaultFallbackReplyNoticeEngine();
  const item = newFallbackReplyNotice("code-924", "title-935");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
