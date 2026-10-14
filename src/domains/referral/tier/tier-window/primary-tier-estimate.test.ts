import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryTierEstimate } from "./primary-tier-estimate.js";

test("PrimaryTierEstimate starts in requested", () => {
  const item = newPrimaryTierEstimate("code-224", "label-568");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryTierEstimate moves to granted", () => {
  const item = newPrimaryTierEstimate("code-224", "label-568");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("PrimaryTierEstimate rejects moves from expired", () => {
  const item = newPrimaryTierEstimate("code-224", "label-568");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
