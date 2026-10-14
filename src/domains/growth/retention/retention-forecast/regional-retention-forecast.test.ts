import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalRetentionForecast } from "./regional-retention-forecast.js";

test("RegionalRetentionForecast starts in proposed", () => {
  const item = newRegionalRetentionForecast("code-796", "label-313");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalRetentionForecast moves to withdrawn", () => {
  const item = newRegionalRetentionForecast("code-796", "label-313");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("RegionalRetentionForecast rejects moves from withdrawn", () => {
  const item = newRegionalRetentionForecast("code-796", "label-313");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
