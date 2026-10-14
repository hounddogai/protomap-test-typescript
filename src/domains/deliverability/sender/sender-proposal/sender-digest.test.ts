import assert from "node:assert/strict";
import { test } from "node:test";
import { newSenderDigest } from "./sender-digest.js";

test("SenderDigest starts in draft", () => {
  const item = newSenderDigest("code-72", "title-269");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SenderDigest moves to pending", () => {
  const item = newSenderDigest("code-72", "title-269");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("SenderDigest rejects moves from closed", () => {
  const item = newSenderDigest("code-72", "title-269");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
