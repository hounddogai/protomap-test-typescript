import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictSenderDigest } from "./strict-sender-digest.js";

test("StrictSenderDigest starts in draft", () => {
  const item = newStrictSenderDigest("code-412", "title-789");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictSenderDigest moves to active", () => {
  const item = newStrictSenderDigest("code-412", "title-789");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("StrictSenderDigest rejects moves from closed", () => {
  const item = newStrictSenderDigest("code-412", "title-789");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
