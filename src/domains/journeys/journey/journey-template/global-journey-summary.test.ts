import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalJourneySummary } from "./global-journey-summary.js";

test("GlobalJourneySummary starts in proposed", () => {
  const item = newGlobalJourneySummary("code-675", "title-857");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalJourneySummary moves to approved", () => {
  const item = newGlobalJourneySummary("code-675", "title-857");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("GlobalJourneySummary rejects moves from withdrawn", () => {
  const item = newGlobalJourneySummary("code-675", "title-857");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
