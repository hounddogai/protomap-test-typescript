import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalNudgeSummary } from "./regional-nudge-summary.js";

test("RegionalNudgeSummary starts in planned", () => {
  const item = newRegionalNudgeSummary("code-72", "title-350");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalNudgeSummary moves to scheduled", () => {
  const item = newRegionalNudgeSummary("code-72", "title-350");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("RegionalNudgeSummary rejects moves from cancelled", () => {
  const item = newRegionalNudgeSummary("code-72", "title-350");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
