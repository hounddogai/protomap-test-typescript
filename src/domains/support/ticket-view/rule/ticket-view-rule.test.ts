import assert from "node:assert/strict";
import { test } from "node:test";
import { newTicketViewRule } from "./ticket-view-rule.js";

test("TicketViewRule starts in open", () => {
  const item = newTicketViewRule("code-544", "label-16");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TicketViewRule moves to reopened", () => {
  const item = newTicketViewRule("code-544", "label-16");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("TicketViewRule rejects moves from archived", () => {
  const item = newTicketViewRule("code-544", "label-16");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
