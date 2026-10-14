import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredDoubleOptInProfile } from "./tiered-double-opt-in-profile.js";

test("TieredDoubleOptInProfile starts in planned", () => {
  const item = newTieredDoubleOptInProfile("code-913", "label-669");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredDoubleOptInProfile moves to scheduled", () => {
  const item = newTieredDoubleOptInProfile("code-913", "label-669");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("TieredDoubleOptInProfile rejects moves from cancelled", () => {
  const item = newTieredDoubleOptInProfile("code-913", "label-669");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
