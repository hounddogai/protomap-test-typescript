import assert from "node:assert/strict";
import { test } from "node:test";
import { newFraudCheckAudit } from "./fraud-check-audit.js";

test("FraudCheckAudit starts in open", () => {
  const item = newFraudCheckAudit("code-679", "label-988");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FraudCheckAudit moves to resolved", () => {
  const item = newFraudCheckAudit("code-679", "label-988");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("FraudCheckAudit rejects moves from archived", () => {
  const item = newFraudCheckAudit("code-679", "label-988");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
