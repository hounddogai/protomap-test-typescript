import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictReputationSummary } from "./strict-reputation-summary.js";

test("StrictReputationSummary starts in proposed", () => {
  const item = newStrictReputationSummary("code-150", "title-58");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictReputationSummary moves to withdrawn", () => {
  const item = newStrictReputationSummary("code-150", "title-58");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("StrictReputationSummary rejects moves from withdrawn", () => {
  const item = newStrictReputationSummary("code-150", "title-58");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
