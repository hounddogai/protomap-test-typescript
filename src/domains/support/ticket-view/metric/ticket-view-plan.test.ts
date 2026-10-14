import assert from "node:assert/strict";
import { test } from "node:test";
import { newTicketViewPlan } from "./ticket-view-plan.js";

test("TicketViewPlan starts in idle", () => {
  const item = newTicketViewPlan("code-102", "name-833");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TicketViewPlan moves to stopped", () => {
  const item = newTicketViewPlan("code-102", "name-833");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("TicketViewPlan rejects moves from stopped", () => {
  const item = newTicketViewPlan("code-102", "name-833");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
