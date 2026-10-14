import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingJourneyAgreement } from "./rolling-journey-agreement.js";

test("RollingJourneyAgreement starts in planned", () => {
  const item = newRollingJourneyAgreement("code-666", "title-296");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingJourneyAgreement moves to in progress", () => {
  const item = newRollingJourneyAgreement("code-666", "title-296");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("RollingJourneyAgreement rejects moves from cancelled", () => {
  const item = newRollingJourneyAgreement("code-666", "title-296");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
