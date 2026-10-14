import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalDomainPlan } from "./seasonal-domain-plan.js";

test("SeasonalDomainPlan starts in planned", () => {
  const item = newSeasonalDomainPlan("code-180", "title-157");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalDomainPlan moves to scheduled", () => {
  const item = newSeasonalDomainPlan("code-180", "title-157");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("SeasonalDomainPlan rejects moves from cancelled", () => {
  const item = newSeasonalDomainPlan("code-180", "title-157");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
