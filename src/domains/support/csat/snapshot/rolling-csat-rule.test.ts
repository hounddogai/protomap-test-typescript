import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingCsatRule } from "./rolling-csat-rule.js";

test("RollingCsatRule starts in idle", () => {
  const item = newRollingCsatRule("code-258", "name-721");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingCsatRule moves to warming", () => {
  const item = newRollingCsatRule("code-258", "name-721");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("RollingCsatRule rejects moves from stopped", () => {
  const item = newRollingCsatRule("code-258", "name-721");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
