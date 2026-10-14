import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalTicketViewBundle } from "./regional-ticket-view-bundle.js";

test("RegionalTicketViewBundle starts in open", () => {
  const item = newRegionalTicketViewBundle("code-436", "label-941");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalTicketViewBundle moves to resolved", () => {
  const item = newRegionalTicketViewBundle("code-436", "label-941");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("RegionalTicketViewBundle rejects moves from archived", () => {
  const item = newRegionalTicketViewBundle("code-436", "label-941");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
