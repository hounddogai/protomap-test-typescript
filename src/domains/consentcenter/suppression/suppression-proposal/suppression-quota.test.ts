import assert from "node:assert/strict";
import { test } from "node:test";
import { newSuppressionQuota } from "./suppression-quota.js";

test("SuppressionQuota starts in new", () => {
  const item = newSuppressionQuota("code-455", "label-188");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SuppressionQuota moves to running", () => {
  const item = newSuppressionQuota("code-455", "label-188");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("SuppressionQuota rejects moves from failed", () => {
  const item = newSuppressionQuota("code-455", "label-188");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
