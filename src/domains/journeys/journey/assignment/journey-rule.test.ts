import assert from "node:assert/strict";
import { test } from "node:test";
import { newJourneyRule } from "./journey-rule.js";

test("JourneyRule starts in planned", () => {
  const item = newJourneyRule("code-962", "label-669");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("JourneyRule moves to in progress", () => {
  const item = newJourneyRule("code-962", "label-669");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("JourneyRule rejects moves from cancelled", () => {
  const item = newJourneyRule("code-962", "label-669");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
