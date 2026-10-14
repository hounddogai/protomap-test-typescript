import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveNudgePreference } from "./adaptive-nudge-preference.js";

test("AdaptiveNudgePreference starts in new", () => {
  const item = newAdaptiveNudgePreference("code-717", "label-438");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveNudgePreference moves to queued", () => {
  const item = newAdaptiveNudgePreference("code-717", "label-438");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("AdaptiveNudgePreference rejects moves from failed", () => {
  const item = newAdaptiveNudgePreference("code-717", "label-438");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
