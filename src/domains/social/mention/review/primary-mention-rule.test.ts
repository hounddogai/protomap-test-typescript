import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryMentionRule } from "./primary-mention-rule.js";

test("PrimaryMentionRule starts in requested", () => {
  const item = newPrimaryMentionRule("code-706", "name-568");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryMentionRule moves to revoked", () => {
  const item = newPrimaryMentionRule("code-706", "name-568");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("PrimaryMentionRule rejects moves from expired", () => {
  const item = newPrimaryMentionRule("code-706", "name-568");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
