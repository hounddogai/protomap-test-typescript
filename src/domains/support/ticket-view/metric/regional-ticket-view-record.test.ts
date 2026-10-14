import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalTicketViewRecord } from "./regional-ticket-view-record.js";

test("RegionalTicketViewRecord starts in new", () => {
  const item = newRegionalTicketViewRecord("code-655", "name-766");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalTicketViewRecord moves to running", () => {
  const item = newRegionalTicketViewRecord("code-655", "name-766");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("RegionalTicketViewRecord rejects moves from failed", () => {
  const item = newRegionalTicketViewRecord("code-655", "name-766");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
