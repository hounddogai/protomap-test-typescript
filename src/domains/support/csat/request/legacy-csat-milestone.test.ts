import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyCsatMilestone } from "./legacy-csat-milestone.js";

test("LegacyCsatMilestone starts in created", () => {
  const item = newLegacyCsatMilestone("code-452", "title-505");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyCsatMilestone moves to published", () => {
  const item = newLegacyCsatMilestone("code-452", "title-505");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("LegacyCsatMilestone rejects moves from retired", () => {
  const item = newLegacyCsatMilestone("code-452", "title-505");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
