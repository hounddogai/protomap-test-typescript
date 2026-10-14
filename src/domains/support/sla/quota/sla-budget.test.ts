import assert from "node:assert/strict";
import { test } from "node:test";
import { newSlaBudget } from "./sla-budget.js";

test("SlaBudget starts in requested", () => {
  const item = newSlaBudget("code-6", "name-683");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SlaBudget moves to granted", () => {
  const item = newSlaBudget("code-6", "name-683");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("SlaBudget rejects moves from expired", () => {
  const item = newSlaBudget("code-6", "name-683");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
