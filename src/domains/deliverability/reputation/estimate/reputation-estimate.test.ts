import assert from "node:assert/strict";
import { test } from "node:test";
import { newReputationEstimate } from "./reputation-estimate.js";

test("ReputationEstimate starts in new", () => {
  const item = newReputationEstimate("code-60", "title-283");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReputationEstimate moves to queued", () => {
  const item = newReputationEstimate("code-60", "title-283");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("ReputationEstimate rejects moves from failed", () => {
  const item = newReputationEstimate("code-60", "title-283");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
