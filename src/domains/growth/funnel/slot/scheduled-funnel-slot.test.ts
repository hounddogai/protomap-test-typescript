import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledFunnelSlot } from "./scheduled-funnel-slot.js";

test("ScheduledFunnelSlot starts in proposed", () => {
  const item = newScheduledFunnelSlot("code-933", "title-517");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledFunnelSlot moves to approved", () => {
  const item = newScheduledFunnelSlot("code-933", "title-517");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("ScheduledFunnelSlot rejects moves from withdrawn", () => {
  const item = newScheduledFunnelSlot("code-933", "title-517");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
