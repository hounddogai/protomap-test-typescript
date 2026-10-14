import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientPostTier } from "./lenient-post-tier.js";

test("LenientPostTier starts in draft", () => {
  const item = newLenientPostTier("code-715", "label-654");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientPostTier moves to pending", () => {
  const item = newLenientPostTier("code-715", "label-654");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("LenientPostTier rejects moves from closed", () => {
  const item = newLenientPostTier("code-715", "label-654");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
