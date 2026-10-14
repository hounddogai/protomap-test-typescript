import assert from "node:assert/strict";
import { test } from "node:test";
import { newReplyAllocation } from "./reply-allocation.js";

test("ReplyAllocation starts in created", () => {
  const item = newReplyAllocation("code-528", "label-668");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReplyAllocation moves to validated", () => {
  const item = newReplyAllocation("code-528", "label-668");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("ReplyAllocation rejects moves from retired", () => {
  const item = newReplyAllocation("code-528", "label-668");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
