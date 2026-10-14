import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryPacingAgreement } from "./primary-pacing-agreement.js";

test("PrimaryPacingAgreement starts in created", () => {
  const item = newPrimaryPacingAgreement("code-403", "label-308");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryPacingAgreement moves to validated", () => {
  const item = newPrimaryPacingAgreement("code-403", "label-308");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("PrimaryPacingAgreement rejects moves from retired", () => {
  const item = newPrimaryPacingAgreement("code-403", "label-308");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
