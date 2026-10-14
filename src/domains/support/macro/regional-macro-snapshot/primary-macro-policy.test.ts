import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryMacroPolicy } from "./primary-macro-policy.js";

test("PrimaryMacroPolicy starts in created", () => {
  const item = newPrimaryMacroPolicy("code-56", "title-305");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryMacroPolicy moves to published", () => {
  const item = newPrimaryMacroPolicy("code-56", "title-305");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("PrimaryMacroPolicy rejects moves from retired", () => {
  const item = newPrimaryMacroPolicy("code-56", "title-305");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
