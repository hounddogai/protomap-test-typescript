import assert from "node:assert/strict";
import { test } from "node:test";
import { newJourneyMilestone } from "./journey-milestone.js";

test("JourneyMilestone starts in created", () => {
  const item = newJourneyMilestone("code-385", "title-162");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("JourneyMilestone moves to published", () => {
  const item = newJourneyMilestone("code-385", "title-162");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("JourneyMilestone rejects moves from retired", () => {
  const item = newJourneyMilestone("code-385", "title-162");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
