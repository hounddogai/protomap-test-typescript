import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedWarmupDraft } from "./capped-warmup-draft.js";

test("CappedWarmupDraft starts in draft", () => {
  const item = newCappedWarmupDraft("code-490", "name-326");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedWarmupDraft moves to pending", () => {
  const item = newCappedWarmupDraft("code-490", "name-326");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("CappedWarmupDraft rejects moves from closed", () => {
  const item = newCappedWarmupDraft("code-490", "name-326");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
