import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalStreakBundle } from "./seasonal-streak-bundle.js";

test("SeasonalStreakBundle starts in proposed", () => {
  const item = newSeasonalStreakBundle("code-42", "label-894");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalStreakBundle moves to approved", () => {
  const item = newSeasonalStreakBundle("code-42", "label-894");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("SeasonalStreakBundle rejects moves from withdrawn", () => {
  const item = newSeasonalStreakBundle("code-42", "label-894");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
