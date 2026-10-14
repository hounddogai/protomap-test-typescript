import assert from "node:assert/strict";
import { test } from "node:test";
import { newWarmupDraft } from "./warmup-draft.js";

test("WarmupDraft starts in new", () => {
  const item = newWarmupDraft("code-117", "name-148");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WarmupDraft moves to done", () => {
  const item = newWarmupDraft("code-117", "name-148");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("WarmupDraft rejects moves from failed", () => {
  const item = newWarmupDraft("code-117", "name-148");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
