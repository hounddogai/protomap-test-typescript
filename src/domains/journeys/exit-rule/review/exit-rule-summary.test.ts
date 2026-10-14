import assert from "node:assert/strict";
import { test } from "node:test";
import { newExitRuleSummary } from "./exit-rule-summary.js";

test("ExitRuleSummary starts in created", () => {
  const item = newExitRuleSummary("code-485", "title-567");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ExitRuleSummary moves to published", () => {
  const item = newExitRuleSummary("code-485", "title-567");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("ExitRuleSummary rejects moves from retired", () => {
  const item = newExitRuleSummary("code-485", "title-567");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
