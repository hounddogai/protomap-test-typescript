import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalPreferenceThreshold } from "./seasonal-preference-threshold.js";

test("SeasonalPreferenceThreshold starts in new", () => {
  const item = newSeasonalPreferenceThreshold("code-720", "label-399");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalPreferenceThreshold moves to running", () => {
  const item = newSeasonalPreferenceThreshold("code-720", "label-399");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("SeasonalPreferenceThreshold rejects moves from failed", () => {
  const item = newSeasonalPreferenceThreshold("code-720", "label-399");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
