import assert from "node:assert/strict";
import { test } from "node:test";
import { newFraudCheckMapping } from "./fraud-check-mapping.js";

test("FraudCheckMapping starts in open", () => {
  const item = newFraudCheckMapping("code-532", "label-256");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FraudCheckMapping moves to reopened", () => {
  const item = newFraudCheckMapping("code-532", "label-256");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("FraudCheckMapping rejects moves from archived", () => {
  const item = newFraudCheckMapping("code-532", "label-256");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
