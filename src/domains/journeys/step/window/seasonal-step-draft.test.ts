import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalStepDraft } from "./seasonal-step-draft.js";

test("SeasonalStepDraft starts in planned", () => {
  const item = newSeasonalStepDraft("code-53", "name-231");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalStepDraft moves to cancelled", () => {
  const item = newSeasonalStepDraft("code-53", "name-231");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("SeasonalStepDraft rejects moves from cancelled", () => {
  const item = newSeasonalStepDraft("code-53", "name-231");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
