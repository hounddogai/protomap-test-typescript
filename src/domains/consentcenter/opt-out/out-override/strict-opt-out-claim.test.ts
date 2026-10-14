import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictOptOutClaim } from "./strict-opt-out-claim.js";

test("StrictOptOutClaim starts in open", () => {
  const item = newStrictOptOutClaim("code-685", "name-509");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictOptOutClaim moves to in review", () => {
  const item = newStrictOptOutClaim("code-685", "name-509");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("StrictOptOutClaim rejects moves from archived", () => {
  const item = newStrictOptOutClaim("code-685", "name-509");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
