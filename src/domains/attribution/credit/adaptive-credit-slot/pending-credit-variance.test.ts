import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingCreditVariance } from "./pending-credit-variance.js";

test("PendingCreditVariance starts in created", () => {
  const item = newPendingCreditVariance("code-649", "label-839");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingCreditVariance moves to published", () => {
  const item = newPendingCreditVariance("code-649", "label-839");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("PendingCreditVariance rejects moves from retired", () => {
  const item = newPendingCreditVariance("code-649", "label-839");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
