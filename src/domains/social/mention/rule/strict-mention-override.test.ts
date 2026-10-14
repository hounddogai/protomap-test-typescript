import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictMentionOverride } from "./strict-mention-override.js";

test("StrictMentionOverride starts in draft", () => {
  const item = newStrictMentionOverride("code-961", "label-1");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictMentionOverride moves to pending", () => {
  const item = newStrictMentionOverride("code-961", "label-1");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("StrictMentionOverride rejects moves from closed", () => {
  const item = newStrictMentionOverride("code-961", "label-1");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
