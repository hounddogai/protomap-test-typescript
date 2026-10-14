import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualChallengeSummary } from "./manual-challenge-summary.js";

test("ManualChallengeSummary starts in idle", () => {
  const item = newManualChallengeSummary("code-766", "name-329");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualChallengeSummary moves to ready", () => {
  const item = newManualChallengeSummary("code-766", "name-329");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("ManualChallengeSummary rejects moves from stopped", () => {
  const item = newManualChallengeSummary("code-766", "name-329");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
