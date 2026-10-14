import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingFunnelThreshold } from "./rolling-funnel-threshold.js";

test("RollingFunnelThreshold starts in created", () => {
  const item = newRollingFunnelThreshold("code-852", "title-941");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingFunnelThreshold moves to validated", () => {
  const item = newRollingFunnelThreshold("code-852", "title-941");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("RollingFunnelThreshold rejects moves from retired", () => {
  const item = newRollingFunnelThreshold("code-852", "title-941");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
