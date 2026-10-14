import assert from "node:assert/strict";
import { test } from "node:test";
import { newReplyAgreement } from "./reply-agreement.js";

test("ReplyAgreement starts in open", () => {
  const item = newReplyAgreement("code-790", "name-723");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReplyAgreement moves to archived", () => {
  const item = newReplyAgreement("code-790", "name-723");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("ReplyAgreement rejects moves from archived", () => {
  const item = newReplyAgreement("code-790", "name-723");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
