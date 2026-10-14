import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryJourneySummary } from "./primary-journey-summary.js";

test("PrimaryJourneySummary starts in created", () => {
  const item = newPrimaryJourneySummary("code-816", "label-581");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryJourneySummary moves to validated", () => {
  const item = newPrimaryJourneySummary("code-816", "label-581");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("PrimaryJourneySummary rejects moves from retired", () => {
  const item = newPrimaryJourneySummary("code-816", "label-581");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
