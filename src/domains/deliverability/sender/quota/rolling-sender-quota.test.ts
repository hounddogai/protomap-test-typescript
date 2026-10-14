import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingSenderQuota } from "./rolling-sender-quota.js";

test("RollingSenderQuota starts in open", () => {
  const item = newRollingSenderQuota("code-411", "name-934");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingSenderQuota moves to reopened", () => {
  const item = newRollingSenderQuota("code-411", "name-934");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("RollingSenderQuota rejects moves from archived", () => {
  const item = newRollingSenderQuota("code-411", "name-934");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
