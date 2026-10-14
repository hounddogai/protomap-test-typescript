import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultReplyAllocationEngine } from "./reply-allocation-engine.js";
import { newReplyAllocation } from "./reply-allocation.js";

test("ReplyAllocationEngine keeps results within bounds", () => {
  const engine = defaultReplyAllocationEngine();
  const item = newReplyAllocation("code-528", "label-668");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
