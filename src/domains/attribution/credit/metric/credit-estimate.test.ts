import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreditEstimate } from "./credit-estimate.js";

test("CreditEstimate starts in idle", () => {
  const item = newCreditEstimate("code-695", "title-391");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreditEstimate moves to warming", () => {
  const item = newCreditEstimate("code-695", "title-391");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("CreditEstimate rejects moves from stopped", () => {
  const item = newCreditEstimate("code-695", "title-391");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
