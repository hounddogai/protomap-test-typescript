import assert from "node:assert/strict";
import { test } from "node:test";
import { newInsightTier } from "./insight-tier.js";

test("InsightTier starts in created", () => {
  const item = newInsightTier("code-12", "title-790");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InsightTier moves to published", () => {
  const item = newInsightTier("code-12", "title-790");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("InsightTier rejects moves from retired", () => {
  const item = newInsightTier("code-12", "title-790");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
