import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingChallengeTemplate } from "./pending-challenge-template.js";

test("PendingChallengeTemplate starts in proposed", () => {
  const item = newPendingChallengeTemplate("code-139", "name-570");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingChallengeTemplate moves to rejected", () => {
  const item = newPendingChallengeTemplate("code-139", "name-570");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("PendingChallengeTemplate rejects moves from withdrawn", () => {
  const item = newPendingChallengeTemplate("code-139", "name-570");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
