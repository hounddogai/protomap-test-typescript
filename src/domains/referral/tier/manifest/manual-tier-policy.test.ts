import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualTierPolicy } from "./manual-tier-policy.js";

test("ManualTierPolicy starts in planned", () => {
  const item = newManualTierPolicy("code-422", "name-70");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualTierPolicy moves to scheduled", () => {
  const item = newManualTierPolicy("code-422", "name-70");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("ManualTierPolicy rejects moves from cancelled", () => {
  const item = newManualTierPolicy("code-422", "name-70");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
