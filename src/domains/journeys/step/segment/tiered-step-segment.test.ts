import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredStepSegment } from "./tiered-step-segment.js";

test("TieredStepSegment starts in created", () => {
  const item = newTieredStepSegment("code-793", "label-608");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredStepSegment moves to published", () => {
  const item = newTieredStepSegment("code-793", "label-608");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("TieredStepSegment rejects moves from retired", () => {
  const item = newTieredStepSegment("code-793", "label-608");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
