import assert from "node:assert/strict";
import { test } from "node:test";
import { newWindowDigest } from "./window-digest.js";

test("WindowDigest starts in draft", () => {
  const item = newWindowDigest("code-919", "name-458");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WindowDigest moves to pending", () => {
  const item = newWindowDigest("code-919", "name-458");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("WindowDigest rejects moves from closed", () => {
  const item = newWindowDigest("code-919", "name-458");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
