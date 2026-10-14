import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyStepScore } from "./legacy-step-score.js";

test("LegacyStepScore starts in proposed", () => {
  const item = newLegacyStepScore("code-340", "title-972");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyStepScore moves to approved", () => {
  const item = newLegacyStepScore("code-340", "title-972");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("LegacyStepScore rejects moves from withdrawn", () => {
  const item = newLegacyStepScore("code-340", "title-972");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
