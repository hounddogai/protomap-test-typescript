import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacySuppressionVariance } from "./legacy-suppression-variance.js";

test("LegacySuppressionVariance starts in created", () => {
  const item = newLegacySuppressionVariance("code-921", "title-417");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacySuppressionVariance moves to validated", () => {
  const item = newLegacySuppressionVariance("code-921", "title-417");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("LegacySuppressionVariance rejects moves from retired", () => {
  const item = newLegacySuppressionVariance("code-921", "title-417");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
