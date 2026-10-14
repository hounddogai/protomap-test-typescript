import assert from "node:assert/strict";
import { test } from "node:test";
import { newFrequencyScore } from "./frequency-score.js";

test("FrequencyScore starts in proposed", () => {
  const item = newFrequencyScore("code-173", "label-723");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FrequencyScore moves to approved", () => {
  const item = newFrequencyScore("code-173", "label-723");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("FrequencyScore rejects moves from withdrawn", () => {
  const item = newFrequencyScore("code-173", "label-723");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
