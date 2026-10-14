import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingOptOutMilestone } from "./rolling-opt-out-milestone.js";

test("RollingOptOutMilestone starts in requested", () => {
  const item = newRollingOptOutMilestone("code-435", "name-905");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingOptOutMilestone moves to revoked", () => {
  const item = newRollingOptOutMilestone("code-435", "name-905");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("RollingOptOutMilestone rejects moves from expired", () => {
  const item = newRollingOptOutMilestone("code-435", "name-905");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
