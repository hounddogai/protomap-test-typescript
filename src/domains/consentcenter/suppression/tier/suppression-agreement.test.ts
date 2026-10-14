import assert from "node:assert/strict";
import { test } from "node:test";
import { newSuppressionAgreement } from "./suppression-agreement.js";

test("SuppressionAgreement starts in planned", () => {
  const item = newSuppressionAgreement("code-833", "name-378");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SuppressionAgreement moves to completed", () => {
  const item = newSuppressionAgreement("code-833", "name-378");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("SuppressionAgreement rejects moves from cancelled", () => {
  const item = newSuppressionAgreement("code-833", "name-378");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
