import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveReplyReservation } from "./adaptive-reply-reservation.js";

test("AdaptiveReplyReservation starts in draft", () => {
  const item = newAdaptiveReplyReservation("code-441", "title-875");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveReplyReservation moves to suspended", () => {
  const item = newAdaptiveReplyReservation("code-441", "title-875");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("AdaptiveReplyReservation rejects moves from closed", () => {
  const item = newAdaptiveReplyReservation("code-441", "title-875");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
