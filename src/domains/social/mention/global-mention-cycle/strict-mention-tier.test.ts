import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictMentionTier } from "./strict-mention-tier.js";

test("StrictMentionTier starts in open", () => {
  const item = newStrictMentionTier("code-234", "title-348");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictMentionTier moves to reopened", () => {
  const item = newStrictMentionTier("code-234", "title-348");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("StrictMentionTier rejects moves from archived", () => {
  const item = newStrictMentionTier("code-234", "title-348");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
