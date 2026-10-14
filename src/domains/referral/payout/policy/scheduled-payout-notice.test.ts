import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledPayoutNotice } from "./scheduled-payout-notice.js";

test("ScheduledPayoutNotice starts in idle", () => {
  const item = newScheduledPayoutNotice("code-754", "title-267");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledPayoutNotice moves to warming", () => {
  const item = newScheduledPayoutNotice("code-754", "title-267");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("ScheduledPayoutNotice rejects moves from stopped", () => {
  const item = newScheduledPayoutNotice("code-754", "title-267");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
