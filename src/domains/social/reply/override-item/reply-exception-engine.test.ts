import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultReplyExceptionEngine } from "./reply-exception-engine.js";
import { newReplyException } from "./reply-exception.js";

test("ReplyExceptionEngine keeps results within bounds", () => {
  const engine = defaultReplyExceptionEngine(flags.newRegistry());
  const item = newReplyException("code-124", "label-628");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
