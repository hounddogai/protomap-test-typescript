import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalInsightAssignment } from "./seasonal-insight-assignment.js";

test("SeasonalInsightAssignment starts in new", () => {
  const item = newSeasonalInsightAssignment("code-802", "name-813");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalInsightAssignment moves to queued", () => {
  const item = newSeasonalInsightAssignment("code-802", "name-813");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("SeasonalInsightAssignment rejects moves from failed", () => {
  const item = newSeasonalInsightAssignment("code-802", "name-813");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
