import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalMentionRollup } from "./global-mention-rollup.js";

test("GlobalMentionRollup starts in open", () => {
  const item = newGlobalMentionRollup("code-244", "title-583");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalMentionRollup moves to in review", () => {
  const item = newGlobalMentionRollup("code-244", "title-583");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("GlobalMentionRollup rejects moves from archived", () => {
  const item = newGlobalMentionRollup("code-244", "title-583");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
