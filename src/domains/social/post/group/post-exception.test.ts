import assert from "node:assert/strict";
import { test } from "node:test";
import { newPostException } from "./post-exception.js";

test("PostException starts in requested", () => {
  const item = newPostException("code-30", "label-642");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PostException moves to revoked", () => {
  const item = newPostException("code-30", "label-642");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("PostException rejects moves from expired", () => {
  const item = newPostException("code-30", "label-642");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
