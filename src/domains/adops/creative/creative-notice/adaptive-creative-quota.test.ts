import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveCreativeQuota } from "./adaptive-creative-quota.js";

test("AdaptiveCreativeQuota starts in requested", () => {
  const item = newAdaptiveCreativeQuota("code-254", "label-587");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveCreativeQuota moves to expired", () => {
  const item = newAdaptiveCreativeQuota("code-254", "label-587");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("AdaptiveCreativeQuota rejects moves from expired", () => {
  const item = newAdaptiveCreativeQuota("code-254", "label-587");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
