import assert from "node:assert/strict";
import { test } from "node:test";
import { newTicketViewPreference } from "./ticket-view-preference.js";

test("TicketViewPreference starts in created", () => {
  const item = newTicketViewPreference("code-955", "title-876");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TicketViewPreference moves to validated", () => {
  const item = newTicketViewPreference("code-955", "title-876");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("TicketViewPreference rejects moves from retired", () => {
  const item = newTicketViewPreference("code-955", "title-876");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
