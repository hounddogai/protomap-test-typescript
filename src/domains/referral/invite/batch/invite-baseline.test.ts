import assert from "node:assert/strict";
import { test } from "node:test";
import { newInviteBaseline } from "./invite-baseline.js";

test("InviteBaseline starts in planned", () => {
  const item = newInviteBaseline("code-218", "label-576");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InviteBaseline moves to in progress", () => {
  const item = newInviteBaseline("code-218", "label-576");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("InviteBaseline rejects moves from cancelled", () => {
  const item = newInviteBaseline("code-218", "label-576");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
