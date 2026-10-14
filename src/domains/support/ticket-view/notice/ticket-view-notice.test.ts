import assert from "node:assert/strict";
import { test } from "node:test";
import { newTicketViewNotice } from "./ticket-view-notice.js";

test("TicketViewNotice starts in new", () => {
  const item = newTicketViewNotice("code-735", "title-643");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TicketViewNotice moves to done", () => {
  const item = newTicketViewNotice("code-735", "title-643");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("TicketViewNotice rejects moves from failed", () => {
  const item = newTicketViewNotice("code-735", "title-643");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
