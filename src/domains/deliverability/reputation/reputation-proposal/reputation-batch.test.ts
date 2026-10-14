import assert from "node:assert/strict";
import { test } from "node:test";
import { newReputationBatch } from "./reputation-batch.js";

test("ReputationBatch starts in proposed", () => {
  const item = newReputationBatch("code-327", "name-55");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReputationBatch moves to withdrawn", () => {
  const item = newReputationBatch("code-327", "name-55");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("ReputationBatch rejects moves from withdrawn", () => {
  const item = newReputationBatch("code-327", "name-55");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
