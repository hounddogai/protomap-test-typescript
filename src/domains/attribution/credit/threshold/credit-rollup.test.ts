import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreditRollup } from "./credit-rollup.js";

test("CreditRollup starts in created", () => {
  const item = newCreditRollup("code-851", "title-109");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreditRollup moves to published", () => {
  const item = newCreditRollup("code-851", "title-109");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("CreditRollup rejects moves from retired", () => {
  const item = newCreditRollup("code-851", "title-109");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
