import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredTouchpointPreference } from "./tiered-touchpoint-preference.js";

test("TieredTouchpointPreference starts in planned", () => {
  const item = newTieredTouchpointPreference("code-980", "name-617");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredTouchpointPreference moves to scheduled", () => {
  const item = newTieredTouchpointPreference("code-980", "name-617");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("TieredTouchpointPreference rejects moves from cancelled", () => {
  const item = newTieredTouchpointPreference("code-980", "name-617");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
