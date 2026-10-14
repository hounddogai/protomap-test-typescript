import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultTicketViewNotice } from "./default-ticket-view-notice.js";

test("DefaultTicketViewNotice starts in open", () => {
  const item = newDefaultTicketViewNotice("code-265", "name-801");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultTicketViewNotice moves to in review", () => {
  const item = newDefaultTicketViewNotice("code-265", "name-801");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("DefaultTicketViewNotice rejects moves from archived", () => {
  const item = newDefaultTicketViewNotice("code-265", "name-801");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
