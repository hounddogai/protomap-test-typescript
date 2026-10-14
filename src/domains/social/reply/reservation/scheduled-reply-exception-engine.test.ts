import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultScheduledReplyExceptionEngine } from "./scheduled-reply-exception-engine.js";
import { newScheduledReplyException } from "./scheduled-reply-exception.js";

test("ScheduledReplyExceptionEngine keeps results within bounds", () => {
  const engine = defaultScheduledReplyExceptionEngine();
  const item = newScheduledReplyException("code-404", "name-901");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
