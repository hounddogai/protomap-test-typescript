import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingWarmupMilestone } from "./rolling-warmup-milestone.js";

test("RollingWarmupMilestone starts in requested", () => {
  const item = newRollingWarmupMilestone("code-695", "label-264");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingWarmupMilestone moves to revoked", () => {
  const item = newRollingWarmupMilestone("code-695", "label-264");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("RollingWarmupMilestone rejects moves from expired", () => {
  const item = newRollingWarmupMilestone("code-695", "label-264");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
