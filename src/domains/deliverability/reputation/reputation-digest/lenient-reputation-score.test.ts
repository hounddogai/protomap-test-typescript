import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientReputationScore } from "./lenient-reputation-score.js";

test("LenientReputationScore starts in proposed", () => {
  const item = newLenientReputationScore("code-923", "title-767");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientReputationScore moves to approved", () => {
  const item = newLenientReputationScore("code-923", "title-767");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("LenientReputationScore rejects moves from withdrawn", () => {
  const item = newLenientReputationScore("code-923", "title-767");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
