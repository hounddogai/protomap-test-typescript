import assert from "node:assert/strict";
import { test } from "node:test";
import { newEnrollmentRule } from "./enrollment-rule.js";

test("EnrollmentRule starts in idle", () => {
  const item = newEnrollmentRule("code-826", "label-756");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EnrollmentRule moves to warming", () => {
  const item = newEnrollmentRule("code-826", "label-756");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("EnrollmentRule rejects moves from stopped", () => {
  const item = newEnrollmentRule("code-826", "label-756");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
