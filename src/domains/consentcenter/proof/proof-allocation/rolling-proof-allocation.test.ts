import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingProofAllocation } from "./rolling-proof-allocation.js";

test("RollingProofAllocation starts in requested", () => {
  const item = newRollingProofAllocation("code-410", "title-346");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingProofAllocation moves to revoked", () => {
  const item = newRollingProofAllocation("code-410", "title-346");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("RollingProofAllocation rejects moves from expired", () => {
  const item = newRollingProofAllocation("code-410", "title-346");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
