import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalSuppressionAgreement } from "./global-suppression-agreement.js";

test("GlobalSuppressionAgreement starts in open", () => {
  const item = newGlobalSuppressionAgreement("code-406", "name-605");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalSuppressionAgreement moves to in review", () => {
  const item = newGlobalSuppressionAgreement("code-406", "name-605");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("GlobalSuppressionAgreement rejects moves from archived", () => {
  const item = newGlobalSuppressionAgreement("code-406", "name-605");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
