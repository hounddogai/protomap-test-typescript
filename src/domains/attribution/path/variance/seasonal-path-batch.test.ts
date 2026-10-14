import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalPathBatch } from "./seasonal-path-batch.js";

test("SeasonalPathBatch starts in created", () => {
  const item = newSeasonalPathBatch("code-275", "label-733");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalPathBatch moves to retired", () => {
  const item = newSeasonalPathBatch("code-275", "label-733");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("SeasonalPathBatch rejects moves from retired", () => {
  const item = newSeasonalPathBatch("code-275", "label-733");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
