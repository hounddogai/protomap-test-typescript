import assert from "node:assert/strict";
import { test } from "node:test";
import { newReplyReservation } from "./reply-reservation.js";

test("ReplyReservation starts in open", () => {
  const item = newReplyReservation("code-619", "name-82");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReplyReservation moves to resolved", () => {
  const item = newReplyReservation("code-619", "name-82");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("ReplyReservation rejects moves from archived", () => {
  const item = newReplyReservation("code-619", "name-82");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
