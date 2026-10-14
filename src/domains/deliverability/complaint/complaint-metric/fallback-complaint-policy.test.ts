import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackComplaintPolicy } from "./fallback-complaint-policy.js";

test("FallbackComplaintPolicy starts in draft", () => {
  const item = newFallbackComplaintPolicy("code-442", "name-636");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackComplaintPolicy moves to active", () => {
  const item = newFallbackComplaintPolicy("code-442", "name-636");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("FallbackComplaintPolicy rejects moves from closed", () => {
  const item = newFallbackComplaintPolicy("code-442", "name-636");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
