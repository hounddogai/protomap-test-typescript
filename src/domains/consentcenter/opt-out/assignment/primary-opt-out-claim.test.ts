import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryOptOutClaim } from "./primary-opt-out-claim.js";

test("PrimaryOptOutClaim starts in created", () => {
  const item = newPrimaryOptOutClaim("code-184", "label-452");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryOptOutClaim moves to validated", () => {
  const item = newPrimaryOptOutClaim("code-184", "label-452");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("PrimaryOptOutClaim rejects moves from retired", () => {
  const item = newPrimaryOptOutClaim("code-184", "label-452");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
