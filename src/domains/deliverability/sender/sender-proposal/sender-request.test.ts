import assert from "node:assert/strict";
import { test } from "node:test";
import { newSenderRequest } from "./sender-request.js";

test("SenderRequest starts in open", () => {
  const item = newSenderRequest("code-634", "title-270");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SenderRequest moves to in review", () => {
  const item = newSenderRequest("code-634", "title-270");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("SenderRequest rejects moves from archived", () => {
  const item = newSenderRequest("code-634", "title-270");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
