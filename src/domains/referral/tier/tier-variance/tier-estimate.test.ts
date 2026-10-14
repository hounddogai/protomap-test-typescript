import assert from "node:assert/strict";
import { test } from "node:test";
import { newTierEstimate } from "./tier-estimate.js";

test("TierEstimate starts in open", () => {
  const item = newTierEstimate("code-574", "name-373");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TierEstimate moves to reopened", () => {
  const item = newTierEstimate("code-574", "name-373");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("TierEstimate rejects moves from archived", () => {
  const item = newTierEstimate("code-574", "name-373");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
