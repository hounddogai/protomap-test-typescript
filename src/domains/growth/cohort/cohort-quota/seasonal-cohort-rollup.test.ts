import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalCohortRollup } from "./seasonal-cohort-rollup.js";

test("SeasonalCohortRollup starts in proposed", () => {
  const item = newSeasonalCohortRollup("code-45", "name-497");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalCohortRollup moves to withdrawn", () => {
  const item = newSeasonalCohortRollup("code-45", "name-497");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("SeasonalCohortRollup rejects moves from withdrawn", () => {
  const item = newSeasonalCohortRollup("code-45", "name-497");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
