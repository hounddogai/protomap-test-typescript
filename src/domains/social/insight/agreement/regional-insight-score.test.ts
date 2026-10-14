import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalInsightScore } from "./regional-insight-score.js";

test("RegionalInsightScore starts in draft", () => {
  const item = newRegionalInsightScore("code-84", "label-469");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalInsightScore moves to active", () => {
  const item = newRegionalInsightScore("code-84", "label-469");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("RegionalInsightScore rejects moves from closed", () => {
  const item = newRegionalInsightScore("code-84", "label-469");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
