import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledMentionMapping } from "./scheduled-mention-mapping.js";

test("ScheduledMentionMapping starts in planned", () => {
  const item = newScheduledMentionMapping("code-966", "label-507");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledMentionMapping moves to scheduled", () => {
  const item = newScheduledMentionMapping("code-966", "label-507");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("ScheduledMentionMapping rejects moves from cancelled", () => {
  const item = newScheduledMentionMapping("code-966", "label-507");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
