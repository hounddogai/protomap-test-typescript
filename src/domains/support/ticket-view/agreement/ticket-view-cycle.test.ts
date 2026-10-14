import assert from "node:assert/strict";
import { test } from "node:test";
import { newTicketViewCycle } from "./ticket-view-cycle.js";

test("TicketViewCycle starts in created", () => {
  const item = newTicketViewCycle("code-996", "title-556");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TicketViewCycle moves to retired", () => {
  const item = newTicketViewCycle("code-996", "title-556");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("TicketViewCycle rejects moves from retired", () => {
  const item = newTicketViewCycle("code-996", "title-556");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
