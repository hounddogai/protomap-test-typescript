import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultPlacementEstimate } from "./default-placement-estimate.js";

test("DefaultPlacementEstimate starts in created", () => {
  const item = newDefaultPlacementEstimate("code-917", "label-139");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultPlacementEstimate moves to published", () => {
  const item = newDefaultPlacementEstimate("code-917", "label-139");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("DefaultPlacementEstimate rejects moves from retired", () => {
  const item = newDefaultPlacementEstimate("code-917", "label-139");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
