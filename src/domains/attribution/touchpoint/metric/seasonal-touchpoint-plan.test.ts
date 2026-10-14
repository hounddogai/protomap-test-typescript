import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalTouchpointPlan } from "./seasonal-touchpoint-plan.js";

test("SeasonalTouchpointPlan starts in created", () => {
  const item = newSeasonalTouchpointPlan("code-253", "title-719");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalTouchpointPlan moves to published", () => {
  const item = newSeasonalTouchpointPlan("code-253", "title-719");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("SeasonalTouchpointPlan rejects moves from retired", () => {
  const item = newSeasonalTouchpointPlan("code-253", "title-719");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
