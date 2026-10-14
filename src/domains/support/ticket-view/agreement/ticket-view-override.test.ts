import assert from "node:assert/strict";
import { test } from "node:test";
import { newTicketViewOverride } from "./ticket-view-override.js";

test("TicketViewOverride starts in created", () => {
  const item = newTicketViewOverride("code-920", "title-775");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TicketViewOverride moves to published", () => {
  const item = newTicketViewOverride("code-920", "title-775");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("TicketViewOverride rejects moves from retired", () => {
  const item = newTicketViewOverride("code-920", "title-775");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
