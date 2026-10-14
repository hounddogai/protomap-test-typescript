import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingJourneySummary } from "./pending-journey-summary.js";

test("PendingJourneySummary starts in created", () => {
  const item = newPendingJourneySummary("code-692", "name-790");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingJourneySummary moves to validated", () => {
  const item = newPendingJourneySummary("code-692", "name-790");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("PendingJourneySummary rejects moves from retired", () => {
  const item = newPendingJourneySummary("code-692", "name-790");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
