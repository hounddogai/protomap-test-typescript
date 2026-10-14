import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackDoubleOptInBundle } from "./fallback-double-opt-in-bundle.js";

test("FallbackDoubleOptInBundle starts in draft", () => {
  const item = newFallbackDoubleOptInBundle("code-758", "name-29");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackDoubleOptInBundle moves to closed", () => {
  const item = newFallbackDoubleOptInBundle("code-758", "name-29");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("FallbackDoubleOptInBundle rejects moves from closed", () => {
  const item = newFallbackDoubleOptInBundle("code-758", "name-29");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
