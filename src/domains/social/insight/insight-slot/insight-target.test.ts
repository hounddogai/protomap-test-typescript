import assert from "node:assert/strict";
import { test } from "node:test";
import { newInsightTarget } from "./insight-target.js";

test("InsightTarget starts in proposed", () => {
  const item = newInsightTarget("code-698", "name-70");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InsightTarget moves to withdrawn", () => {
  const item = newInsightTarget("code-698", "name-70");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("InsightTarget rejects moves from withdrawn", () => {
  const item = newInsightTarget("code-698", "name-70");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
