import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientInviteException } from "./lenient-invite-exception.js";

test("LenientInviteException starts in open", () => {
  const item = newLenientInviteException("code-487", "label-701");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientInviteException moves to in review", () => {
  const item = newLenientInviteException("code-487", "label-701");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("LenientInviteException rejects moves from archived", () => {
  const item = newLenientInviteException("code-487", "label-701");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
