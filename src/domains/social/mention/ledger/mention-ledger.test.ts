import assert from "node:assert/strict";
import { test } from "node:test";
import { newMentionLedger } from "./mention-ledger.js";

test("MentionLedger starts in idle", () => {
  const item = newMentionLedger("code-743", "name-566");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MentionLedger moves to warming", () => {
  const item = newMentionLedger("code-743", "name-566");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("MentionLedger rejects moves from stopped", () => {
  const item = newMentionLedger("code-743", "name-566");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
