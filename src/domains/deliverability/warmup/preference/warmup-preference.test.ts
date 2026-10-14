import assert from "node:assert/strict";
import { test } from "node:test";
import { newWarmupPreference } from "./warmup-preference.js";

test("WarmupPreference starts in draft", () => {
  const item = newWarmupPreference("code-404", "label-905");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WarmupPreference moves to pending", () => {
  const item = newWarmupPreference("code-404", "label-905");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("WarmupPreference rejects moves from closed", () => {
  const item = newWarmupPreference("code-404", "label-905");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
