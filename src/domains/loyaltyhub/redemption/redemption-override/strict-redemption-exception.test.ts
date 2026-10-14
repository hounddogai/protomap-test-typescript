import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictRedemptionException } from "./strict-redemption-exception.js";

test("StrictRedemptionException starts in new", () => {
  const item = newStrictRedemptionException("code-281", "title-424");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictRedemptionException moves to done", () => {
  const item = newStrictRedemptionException("code-281", "title-424");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("StrictRedemptionException rejects moves from failed", () => {
  const item = newStrictRedemptionException("code-281", "title-424");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
