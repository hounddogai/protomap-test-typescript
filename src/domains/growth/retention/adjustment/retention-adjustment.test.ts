import assert from "node:assert/strict";
import { test } from "node:test";
import { newRetentionAdjustment } from "./retention-adjustment.js";

test("RetentionAdjustment starts in created", () => {
  const item = newRetentionAdjustment("code-922", "title-705");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RetentionAdjustment moves to validated", () => {
  const item = newRetentionAdjustment("code-922", "title-705");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("RetentionAdjustment rejects moves from retired", () => {
  const item = newRetentionAdjustment("code-922", "title-705");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
