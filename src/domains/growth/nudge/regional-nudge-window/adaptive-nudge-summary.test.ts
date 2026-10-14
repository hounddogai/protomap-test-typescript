import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveNudgeSummary } from "./adaptive-nudge-summary.js";

test("AdaptiveNudgeSummary starts in new", () => {
  const item = newAdaptiveNudgeSummary("code-41", "title-542");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveNudgeSummary moves to queued", () => {
  const item = newAdaptiveNudgeSummary("code-41", "title-542");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("AdaptiveNudgeSummary rejects moves from failed", () => {
  const item = newAdaptiveNudgeSummary("code-41", "title-542");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
