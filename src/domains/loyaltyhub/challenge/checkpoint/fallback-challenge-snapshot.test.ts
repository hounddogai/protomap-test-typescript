import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackChallengeSnapshot } from "./fallback-challenge-snapshot.js";

test("FallbackChallengeSnapshot starts in proposed", () => {
  const item = newFallbackChallengeSnapshot("code-866", "label-2");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackChallengeSnapshot moves to rejected", () => {
  const item = newFallbackChallengeSnapshot("code-866", "label-2");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("FallbackChallengeSnapshot rejects moves from withdrawn", () => {
  const item = newFallbackChallengeSnapshot("code-866", "label-2");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
