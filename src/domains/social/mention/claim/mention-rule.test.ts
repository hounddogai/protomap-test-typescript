import assert from "node:assert/strict";
import { test } from "node:test";
import { newMentionRule } from "./mention-rule.js";

test("MentionRule starts in requested", () => {
  const item = newMentionRule("code-985", "title-696");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MentionRule moves to granted", () => {
  const item = newMentionRule("code-985", "title-696");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("MentionRule rejects moves from expired", () => {
  const item = newMentionRule("code-985", "title-696");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
