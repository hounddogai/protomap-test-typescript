import assert from "node:assert/strict";
import { test } from "node:test";
import { newStreakSummary } from "./streak-summary.js";

test("StreakSummary starts in proposed", () => {
  const item = newStreakSummary("code-901", "name-315");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StreakSummary moves to withdrawn", () => {
  const item = newStreakSummary("code-901", "name-315");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("StreakSummary rejects moves from withdrawn", () => {
  const item = newStreakSummary("code-901", "name-315");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
