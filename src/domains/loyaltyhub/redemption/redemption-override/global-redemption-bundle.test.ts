import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalRedemptionBundle } from "./global-redemption-bundle.js";

test("GlobalRedemptionBundle starts in planned", () => {
  const item = newGlobalRedemptionBundle("code-445", "label-547");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalRedemptionBundle moves to scheduled", () => {
  const item = newGlobalRedemptionBundle("code-445", "label-547");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("GlobalRedemptionBundle rejects moves from cancelled", () => {
  const item = newGlobalRedemptionBundle("code-445", "label-547");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
