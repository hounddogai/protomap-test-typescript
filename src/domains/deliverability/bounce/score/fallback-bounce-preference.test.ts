import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackBouncePreference } from "./fallback-bounce-preference.js";

test("FallbackBouncePreference starts in draft", () => {
  const item = newFallbackBouncePreference("code-762", "label-40");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackBouncePreference moves to suspended", () => {
  const item = newFallbackBouncePreference("code-762", "label-40");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("FallbackBouncePreference rejects moves from closed", () => {
  const item = newFallbackBouncePreference("code-762", "label-40");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
