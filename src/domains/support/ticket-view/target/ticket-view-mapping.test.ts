import assert from "node:assert/strict";
import { test } from "node:test";
import { newTicketViewMapping } from "./ticket-view-mapping.js";

test("TicketViewMapping starts in draft", () => {
  const item = newTicketViewMapping("code-87", "title-328");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TicketViewMapping moves to suspended", () => {
  const item = newTicketViewMapping("code-87", "title-328");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("TicketViewMapping rejects moves from closed", () => {
  const item = newTicketViewMapping("code-87", "title-328");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
