import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledCreativeOverride } from "./scheduled-creative-override.js";

test("ScheduledCreativeOverride starts in requested", () => {
  const item = newScheduledCreativeOverride("code-889", "name-101");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledCreativeOverride moves to expired", () => {
  const item = newScheduledCreativeOverride("code-889", "name-101");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("ScheduledCreativeOverride rejects moves from expired", () => {
  const item = newScheduledCreativeOverride("code-889", "name-101");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
