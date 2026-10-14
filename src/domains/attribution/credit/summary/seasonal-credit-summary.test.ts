import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalCreditSummary } from "./seasonal-credit-summary.js";

test("SeasonalCreditSummary starts in idle", () => {
  const item = newSeasonalCreditSummary("code-813", "title-437");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalCreditSummary moves to stopped", () => {
  const item = newSeasonalCreditSummary("code-813", "title-437");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("SeasonalCreditSummary rejects moves from stopped", () => {
  const item = newSeasonalCreditSummary("code-813", "title-437");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
