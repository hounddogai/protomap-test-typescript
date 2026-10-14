import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyReputationAssignment } from "./legacy-reputation-assignment.js";

test("LegacyReputationAssignment starts in created", () => {
  const item = newLegacyReputationAssignment("code-531", "label-802");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyReputationAssignment moves to validated", () => {
  const item = newLegacyReputationAssignment("code-531", "label-802");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("LegacyReputationAssignment rejects moves from retired", () => {
  const item = newLegacyReputationAssignment("code-531", "label-802");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
