import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredReplyRequest } from "./tiered-reply-request.js";

test("TieredReplyRequest starts in draft", () => {
  const item = newTieredReplyRequest("code-865", "title-781");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredReplyRequest moves to pending", () => {
  const item = newTieredReplyRequest("code-865", "title-781");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("TieredReplyRequest rejects moves from closed", () => {
  const item = newTieredReplyRequest("code-865", "title-781");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
