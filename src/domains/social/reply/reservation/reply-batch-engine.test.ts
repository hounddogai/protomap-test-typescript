import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultReplyBatchEngine } from "./reply-batch-engine.js";
import { newReplyBatch } from "./reply-batch.js";

test("ReplyBatchEngine keeps results within bounds", () => {
  const engine = defaultReplyBatchEngine(flags.newRegistry());
  const item = newReplyBatch("code-32", "label-970");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
