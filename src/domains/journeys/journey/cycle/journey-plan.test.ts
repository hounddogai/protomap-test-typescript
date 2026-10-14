import assert from "node:assert/strict";
import { test } from "node:test";
import { newJourneyPlan } from "./journey-plan.js";

test("JourneyPlan starts in open", () => {
  const item = newJourneyPlan("code-890", "title-903");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("JourneyPlan moves to in review", () => {
  const item = newJourneyPlan("code-890", "title-903");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("JourneyPlan rejects moves from archived", () => {
  const item = newJourneyPlan("code-890", "title-903");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
