import assert from "node:assert/strict";
import { test } from "node:test";
import { newReplyPolicy } from "./reply-policy.js";

test("ReplyPolicy starts in planned", () => {
  const item = newReplyPolicy("code-580", "name-805");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReplyPolicy moves to scheduled", () => {
  const item = newReplyPolicy("code-580", "name-805");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("ReplyPolicy rejects moves from cancelled", () => {
  const item = newReplyPolicy("code-580", "name-805");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
