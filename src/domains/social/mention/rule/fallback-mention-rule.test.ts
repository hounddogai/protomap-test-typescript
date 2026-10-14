import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackMentionRule } from "./fallback-mention-rule.js";

test("FallbackMentionRule starts in open", () => {
  const item = newFallbackMentionRule("code-114", "title-771");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackMentionRule moves to archived", () => {
  const item = newFallbackMentionRule("code-114", "title-771");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("FallbackMentionRule rejects moves from archived", () => {
  const item = newFallbackMentionRule("code-114", "title-771");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
