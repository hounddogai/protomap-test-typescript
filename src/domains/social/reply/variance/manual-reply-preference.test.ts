import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualReplyPreference } from "./manual-reply-preference.js";

test("ManualReplyPreference starts in open", () => {
  const item = newManualReplyPreference("code-168", "name-449");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualReplyPreference moves to archived", () => {
  const item = newManualReplyPreference("code-168", "name-449");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("ManualReplyPreference rejects moves from archived", () => {
  const item = newManualReplyPreference("code-168", "name-449");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
