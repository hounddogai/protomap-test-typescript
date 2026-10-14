import assert from "node:assert/strict";
import { test } from "node:test";
import { newRetentionEstimate } from "./retention-estimate.js";

test("RetentionEstimate starts in planned", () => {
  const item = newRetentionEstimate("code-348", "label-907");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RetentionEstimate moves to scheduled", () => {
  const item = newRetentionEstimate("code-348", "label-907");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("RetentionEstimate rejects moves from cancelled", () => {
  const item = newRetentionEstimate("code-348", "label-907");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
