import assert from "node:assert/strict";
import { test } from "node:test";
import { newMentionTier } from "./mention-tier.js";

test("MentionTier starts in requested", () => {
  const item = newMentionTier("code-980", "name-52");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MentionTier moves to granted", () => {
  const item = newMentionTier("code-980", "name-52");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("MentionTier rejects moves from expired", () => {
  const item = newMentionTier("code-980", "name-52");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
