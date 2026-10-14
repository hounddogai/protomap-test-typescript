import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultManualReplyExceptionEngine } from "./manual-reply-exception-engine.js";
import { newManualReplyException } from "./manual-reply-exception.js";

test("ManualReplyExceptionEngine keeps results within bounds", () => {
  const engine = defaultManualReplyExceptionEngine();
  const item = newManualReplyException("code-926", "label-363");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
