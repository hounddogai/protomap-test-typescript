import assert from "node:assert/strict";
import { test } from "node:test";
import { newReputationSummary } from "./reputation-summary.js";

test("ReputationSummary starts in created", () => {
  const item = newReputationSummary("code-695", "title-750");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReputationSummary moves to published", () => {
  const item = newReputationSummary("code-695", "title-750");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("ReputationSummary rejects moves from retired", () => {
  const item = newReputationSummary("code-695", "title-750");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
