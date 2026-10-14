import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultReplyRequestEngine } from "./reply-request-engine.js";
import { newReplyRequest } from "./reply-request.js";

test("ReplyRequestEngine keeps results within bounds", () => {
  const engine = defaultReplyRequestEngine(flags.newRegistry());
  const item = newReplyRequest("code-87", "title-76");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
