import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultMentionRule } from "./default-mention-rule.js";

test("DefaultMentionRule starts in proposed", () => {
  const item = newDefaultMentionRule("code-746", "label-323");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultMentionRule moves to rejected", () => {
  const item = newDefaultMentionRule("code-746", "label-323");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("DefaultMentionRule rejects moves from withdrawn", () => {
  const item = newDefaultMentionRule("code-746", "label-323");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
