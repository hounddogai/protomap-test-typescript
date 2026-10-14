import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveInviteAdjustment } from "./adaptive-invite-adjustment.js";

test("AdaptiveInviteAdjustment starts in created", () => {
  const item = newAdaptiveInviteAdjustment("code-950", "name-651");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveInviteAdjustment moves to validated", () => {
  const item = newAdaptiveInviteAdjustment("code-950", "name-651");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("AdaptiveInviteAdjustment rejects moves from retired", () => {
  const item = newAdaptiveInviteAdjustment("code-950", "name-651");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
