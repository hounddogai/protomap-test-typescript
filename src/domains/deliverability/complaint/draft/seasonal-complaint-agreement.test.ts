import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalComplaintAgreement } from "./seasonal-complaint-agreement.js";

test("SeasonalComplaintAgreement starts in idle", () => {
  const item = newSeasonalComplaintAgreement("code-278", "name-649");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalComplaintAgreement moves to stopped", () => {
  const item = newSeasonalComplaintAgreement("code-278", "name-649");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("SeasonalComplaintAgreement rejects moves from stopped", () => {
  const item = newSeasonalComplaintAgreement("code-278", "name-649");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
