import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledMacroQuota } from "./scheduled-macro-quota.js";

test("ScheduledMacroQuota starts in draft", () => {
  const item = newScheduledMacroQuota("code-484", "title-137");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledMacroQuota moves to pending", () => {
  const item = newScheduledMacroQuota("code-484", "title-137");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("ScheduledMacroQuota rejects moves from closed", () => {
  const item = newScheduledMacroQuota("code-484", "title-137");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
