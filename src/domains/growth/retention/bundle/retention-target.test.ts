import assert from "node:assert/strict";
import { test } from "node:test";
import { newRetentionTarget } from "./retention-target.js";

test("RetentionTarget starts in new", () => {
  const item = newRetentionTarget("code-859", "name-170");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RetentionTarget moves to running", () => {
  const item = newRetentionTarget("code-859", "name-170");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("RetentionTarget rejects moves from failed", () => {
  const item = newRetentionTarget("code-859", "name-170");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
