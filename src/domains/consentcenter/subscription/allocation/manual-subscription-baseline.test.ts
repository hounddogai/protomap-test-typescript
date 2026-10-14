import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualSubscriptionBaseline } from "./manual-subscription-baseline.js";

test("ManualSubscriptionBaseline starts in open", () => {
  const item = newManualSubscriptionBaseline("code-798", "name-699");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualSubscriptionBaseline moves to in review", () => {
  const item = newManualSubscriptionBaseline("code-798", "name-699");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("ManualSubscriptionBaseline rejects moves from archived", () => {
  const item = newManualSubscriptionBaseline("code-798", "name-699");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
