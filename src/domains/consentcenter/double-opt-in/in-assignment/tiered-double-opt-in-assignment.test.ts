import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredDoubleOptInAssignment } from "./tiered-double-opt-in-assignment.js";

test("TieredDoubleOptInAssignment starts in requested", () => {
  const item = newTieredDoubleOptInAssignment("code-27", "name-576");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredDoubleOptInAssignment moves to revoked", () => {
  const item = newTieredDoubleOptInAssignment("code-27", "name-576");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("TieredDoubleOptInAssignment rejects moves from expired", () => {
  const item = newTieredDoubleOptInAssignment("code-27", "name-576");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
