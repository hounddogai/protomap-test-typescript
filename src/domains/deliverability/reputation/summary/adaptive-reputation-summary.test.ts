import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveReputationSummary } from "./adaptive-reputation-summary.js";

test("AdaptiveReputationSummary starts in open", () => {
  const item = newAdaptiveReputationSummary("code-118", "title-504");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveReputationSummary moves to reopened", () => {
  const item = newAdaptiveReputationSummary("code-118", "title-504");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("AdaptiveReputationSummary rejects moves from archived", () => {
  const item = newAdaptiveReputationSummary("code-118", "title-504");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
