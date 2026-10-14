import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveConversionQuota } from "./adaptive-conversion-quota.js";

test("AdaptiveConversionQuota starts in planned", () => {
  const item = newAdaptiveConversionQuota("code-962", "title-315");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveConversionQuota moves to cancelled", () => {
  const item = newAdaptiveConversionQuota("code-962", "title-315");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("AdaptiveConversionQuota rejects moves from cancelled", () => {
  const item = newAdaptiveConversionQuota("code-962", "title-315");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
