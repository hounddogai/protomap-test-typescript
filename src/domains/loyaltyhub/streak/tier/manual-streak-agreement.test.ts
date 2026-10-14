import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualStreakAgreement } from "./manual-streak-agreement.js";

test("ManualStreakAgreement starts in created", () => {
  const item = newManualStreakAgreement("code-522", "title-139");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualStreakAgreement moves to validated", () => {
  const item = newManualStreakAgreement("code-522", "title-139");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("ManualStreakAgreement rejects moves from retired", () => {
  const item = newManualStreakAgreement("code-522", "title-139");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
