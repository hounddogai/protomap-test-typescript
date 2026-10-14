import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredWaitPlan } from "./tiered-wait-plan.js";

test("TieredWaitPlan starts in open", () => {
  const item = newTieredWaitPlan("code-994", "name-252");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredWaitPlan moves to archived", () => {
  const item = newTieredWaitPlan("code-994", "name-252");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("TieredWaitPlan rejects moves from archived", () => {
  const item = newTieredWaitPlan("code-994", "name-252");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
