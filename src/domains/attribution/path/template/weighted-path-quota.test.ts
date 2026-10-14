import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedPathQuota } from "./weighted-path-quota.js";

test("WeightedPathQuota starts in created", () => {
  const item = newWeightedPathQuota("code-123", "title-328");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedPathQuota moves to published", () => {
  const item = newWeightedPathQuota("code-123", "title-328");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("WeightedPathQuota rejects moves from retired", () => {
  const item = newWeightedPathQuota("code-123", "title-328");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
