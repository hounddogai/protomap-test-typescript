import assert from "node:assert/strict";
import { test } from "node:test";
import { newRetentionBatch } from "./retention-batch.js";

test("RetentionBatch starts in proposed", () => {
  const item = newRetentionBatch("code-315", "label-725");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RetentionBatch moves to withdrawn", () => {
  const item = newRetentionBatch("code-315", "label-725");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("RetentionBatch rejects moves from withdrawn", () => {
  const item = newRetentionBatch("code-315", "label-725");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
