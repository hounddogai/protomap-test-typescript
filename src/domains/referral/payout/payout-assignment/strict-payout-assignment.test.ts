import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictPayoutAssignment } from "./strict-payout-assignment.js";

test("StrictPayoutAssignment starts in created", () => {
  const item = newStrictPayoutAssignment("code-531", "label-686");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictPayoutAssignment moves to validated", () => {
  const item = newStrictPayoutAssignment("code-531", "label-686");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("StrictPayoutAssignment rejects moves from retired", () => {
  const item = newStrictPayoutAssignment("code-531", "label-686");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
