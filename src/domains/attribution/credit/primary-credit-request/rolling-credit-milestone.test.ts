import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingCreditMilestone } from "./rolling-credit-milestone.js";

test("RollingCreditMilestone starts in open", () => {
  const item = newRollingCreditMilestone("code-848", "title-947");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingCreditMilestone moves to resolved", () => {
  const item = newRollingCreditMilestone("code-848", "title-947");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("RollingCreditMilestone rejects moves from archived", () => {
  const item = newRollingCreditMilestone("code-848", "title-947");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
