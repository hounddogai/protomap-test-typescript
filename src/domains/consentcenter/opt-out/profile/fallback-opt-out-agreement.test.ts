import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackOptOutAgreement } from "./fallback-opt-out-agreement.js";

test("FallbackOptOutAgreement starts in open", () => {
  const item = newFallbackOptOutAgreement("code-992", "title-363");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackOptOutAgreement moves to in review", () => {
  const item = newFallbackOptOutAgreement("code-992", "title-363");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("FallbackOptOutAgreement rejects moves from archived", () => {
  const item = newFallbackOptOutAgreement("code-992", "title-363");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
