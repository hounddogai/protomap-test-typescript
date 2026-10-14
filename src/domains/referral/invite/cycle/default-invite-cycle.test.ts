import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultInviteCycle } from "./default-invite-cycle.js";

test("DefaultInviteCycle starts in proposed", () => {
  const item = newDefaultInviteCycle("code-15", "label-117");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultInviteCycle moves to rejected", () => {
  const item = newDefaultInviteCycle("code-15", "label-117");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("DefaultInviteCycle rejects moves from withdrawn", () => {
  const item = newDefaultInviteCycle("code-15", "label-117");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
