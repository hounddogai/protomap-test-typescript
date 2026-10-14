import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledNudgeTier } from "./scheduled-nudge-tier.js";

test("ScheduledNudgeTier starts in requested", () => {
  const item = newScheduledNudgeTier("code-814", "title-364");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledNudgeTier moves to granted", () => {
  const item = newScheduledNudgeTier("code-814", "title-364");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("ScheduledNudgeTier rejects moves from expired", () => {
  const item = newScheduledNudgeTier("code-814", "title-364");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
