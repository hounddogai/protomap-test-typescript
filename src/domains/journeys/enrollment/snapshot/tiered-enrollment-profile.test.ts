import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredEnrollmentProfile } from "./tiered-enrollment-profile.js";

test("TieredEnrollmentProfile starts in idle", () => {
  const item = newTieredEnrollmentProfile("code-664", "label-583");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredEnrollmentProfile moves to draining", () => {
  const item = newTieredEnrollmentProfile("code-664", "label-583");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("TieredEnrollmentProfile rejects moves from stopped", () => {
  const item = newTieredEnrollmentProfile("code-664", "label-583");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
