import assert from "node:assert/strict";
import { test } from "node:test";
import { newInsightRule } from "./insight-rule.js";

test("InsightRule starts in proposed", () => {
  const item = newInsightRule("code-842", "name-700");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InsightRule moves to approved", () => {
  const item = newInsightRule("code-842", "name-700");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("InsightRule rejects moves from withdrawn", () => {
  const item = newInsightRule("code-842", "name-700");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
