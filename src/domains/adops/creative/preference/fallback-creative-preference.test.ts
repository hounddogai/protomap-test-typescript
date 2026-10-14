import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackCreativePreference } from "./fallback-creative-preference.js";

test("FallbackCreativePreference starts in proposed", () => {
  const item = newFallbackCreativePreference("code-815", "title-381");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackCreativePreference moves to rejected", () => {
  const item = newFallbackCreativePreference("code-815", "title-381");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("FallbackCreativePreference rejects moves from withdrawn", () => {
  const item = newFallbackCreativePreference("code-815", "title-381");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
