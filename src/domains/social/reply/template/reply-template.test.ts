import assert from "node:assert/strict";
import { test } from "node:test";
import { newReplyTemplate } from "./reply-template.js";

test("ReplyTemplate starts in idle", () => {
  const item = newReplyTemplate("code-627", "label-296");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReplyTemplate moves to ready", () => {
  const item = newReplyTemplate("code-627", "label-296");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("ReplyTemplate rejects moves from stopped", () => {
  const item = newReplyTemplate("code-627", "label-296");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
