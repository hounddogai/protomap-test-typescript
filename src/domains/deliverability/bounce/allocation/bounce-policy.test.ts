import assert from "node:assert/strict";
import { test } from "node:test";
import { newBouncePolicy } from "./bounce-policy.js";

test("BouncePolicy starts in open", () => {
  const item = newBouncePolicy("code-305", "name-752");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BouncePolicy moves to in review", () => {
  const item = newBouncePolicy("code-305", "name-752");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("BouncePolicy rejects moves from archived", () => {
  const item = newBouncePolicy("code-305", "name-752");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
