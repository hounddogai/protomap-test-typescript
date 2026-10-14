import assert from "node:assert/strict";
import { test } from "node:test";
import { newPacingAgreement } from "./pacing-agreement.js";

test("PacingAgreement starts in planned", () => {
  const item = newPacingAgreement("code-72", "label-164");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PacingAgreement moves to completed", () => {
  const item = newPacingAgreement("code-72", "label-164");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("PacingAgreement rejects moves from cancelled", () => {
  const item = newPacingAgreement("code-72", "label-164");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
