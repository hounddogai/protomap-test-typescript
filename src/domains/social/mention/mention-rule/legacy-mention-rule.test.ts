import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyMentionRule } from "./legacy-mention-rule.js";

test("LegacyMentionRule starts in idle", () => {
  const item = newLegacyMentionRule("code-920", "title-22");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyMentionRule moves to draining", () => {
  const item = newLegacyMentionRule("code-920", "title-22");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("LegacyMentionRule rejects moves from stopped", () => {
  const item = newLegacyMentionRule("code-920", "title-22");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
