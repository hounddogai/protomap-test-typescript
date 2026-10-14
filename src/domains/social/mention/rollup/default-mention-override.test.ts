import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultMentionOverride } from "./default-mention-override.js";

test("DefaultMentionOverride starts in planned", () => {
  const item = newDefaultMentionOverride("code-627", "label-312");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultMentionOverride moves to scheduled", () => {
  const item = newDefaultMentionOverride("code-627", "label-312");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("DefaultMentionOverride rejects moves from cancelled", () => {
  const item = newDefaultMentionOverride("code-627", "label-312");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
