import assert from "node:assert/strict";
import { test } from "node:test";
import { newMentionMapping } from "./mention-mapping.js";

test("MentionMapping starts in planned", () => {
  const item = newMentionMapping("code-891", "name-893");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MentionMapping moves to in progress", () => {
  const item = newMentionMapping("code-891", "name-893");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("MentionMapping rejects moves from cancelled", () => {
  const item = newMentionMapping("code-891", "name-893");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
