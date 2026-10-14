import assert from "node:assert/strict";
import { test } from "node:test";
import { newPostTier } from "./post-tier.js";

test("PostTier starts in created", () => {
  const item = newPostTier("code-900", "name-670");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PostTier moves to validated", () => {
  const item = newPostTier("code-900", "name-670");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("PostTier rejects moves from retired", () => {
  const item = newPostTier("code-900", "name-670");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
