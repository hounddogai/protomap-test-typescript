import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualMentionClaim } from "./manual-mention-claim.js";

test("ManualMentionClaim starts in open", () => {
  const item = newManualMentionClaim("code-668", "name-917");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualMentionClaim moves to reopened", () => {
  const item = newManualMentionClaim("code-668", "name-917");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("ManualMentionClaim rejects moves from archived", () => {
  const item = newManualMentionClaim("code-668", "name-917");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
