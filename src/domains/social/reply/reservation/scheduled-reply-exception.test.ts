import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledReplyException } from "./scheduled-reply-exception.js";

test("ScheduledReplyException starts in open", () => {
  const item = newScheduledReplyException("code-404", "name-901");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledReplyException moves to reopened", () => {
  const item = newScheduledReplyException("code-404", "name-901");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("ScheduledReplyException rejects moves from archived", () => {
  const item = newScheduledReplyException("code-404", "name-901");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
