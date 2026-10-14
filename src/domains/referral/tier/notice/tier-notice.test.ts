import assert from "node:assert/strict";
import { test } from "node:test";
import { newTierNotice } from "./tier-notice.js";

test("TierNotice starts in idle", () => {
  const item = newTierNotice("code-425", "label-65");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TierNotice moves to ready", () => {
  const item = newTierNotice("code-425", "label-65");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("TierNotice rejects moves from stopped", () => {
  const item = newTierNotice("code-425", "label-65");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
