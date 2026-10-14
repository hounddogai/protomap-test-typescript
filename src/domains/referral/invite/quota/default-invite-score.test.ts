import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultInviteScore } from "./default-invite-score.js";

test("DefaultInviteScore starts in proposed", () => {
  const item = newDefaultInviteScore("code-956", "title-876");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultInviteScore moves to approved", () => {
  const item = newDefaultInviteScore("code-956", "title-876");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("DefaultInviteScore rejects moves from withdrawn", () => {
  const item = newDefaultInviteScore("code-956", "title-876");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
