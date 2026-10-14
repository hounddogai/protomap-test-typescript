import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreditBaseline } from "./credit-baseline.js";

test("CreditBaseline starts in new", () => {
  const item = newCreditBaseline("code-205", "label-573");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreditBaseline moves to done", () => {
  const item = newCreditBaseline("code-205", "label-573");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("CreditBaseline rejects moves from failed", () => {
  const item = newCreditBaseline("code-205", "label-573");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
