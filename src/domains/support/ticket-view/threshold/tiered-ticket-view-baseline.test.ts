import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredTicketViewBaseline } from "./tiered-ticket-view-baseline.js";

test("TieredTicketViewBaseline starts in created", () => {
  const item = newTieredTicketViewBaseline("code-200", "name-332");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredTicketViewBaseline moves to published", () => {
  const item = newTieredTicketViewBaseline("code-200", "name-332");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("TieredTicketViewBaseline rejects moves from retired", () => {
  const item = newTieredTicketViewBaseline("code-200", "name-332");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
