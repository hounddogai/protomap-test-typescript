import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultMentionAdjustment } from "./default-mention-adjustment.js";

test("DefaultMentionAdjustment starts in open", () => {
  const item = newDefaultMentionAdjustment("code-954", "title-246");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultMentionAdjustment moves to resolved", () => {
  const item = newDefaultMentionAdjustment("code-954", "title-246");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("DefaultMentionAdjustment rejects moves from archived", () => {
  const item = newDefaultMentionAdjustment("code-954", "title-246");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
