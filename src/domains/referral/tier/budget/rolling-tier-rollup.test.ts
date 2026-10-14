import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingTierRollup } from "./rolling-tier-rollup.js";

test("RollingTierRollup starts in proposed", () => {
  const item = newRollingTierRollup("code-447", "label-389");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingTierRollup moves to rejected", () => {
  const item = newRollingTierRollup("code-447", "label-389");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("RollingTierRollup rejects moves from withdrawn", () => {
  const item = newRollingTierRollup("code-447", "label-389");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
