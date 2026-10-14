import assert from "node:assert/strict";
import { test } from "node:test";
import { newMentionPreference } from "./mention-preference.js";

test("MentionPreference starts in requested", () => {
  const item = newMentionPreference("code-645", "name-242");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MentionPreference moves to revoked", () => {
  const item = newMentionPreference("code-645", "name-242");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("MentionPreference rejects moves from expired", () => {
  const item = newMentionPreference("code-645", "name-242");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
