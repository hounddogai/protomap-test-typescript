import assert from "node:assert/strict";
import { test } from "node:test";
import { newEscalationQuota } from "./escalation-quota.js";

test("EscalationQuota starts in idle", () => {
  const item = newEscalationQuota("code-585", "name-315");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EscalationQuota moves to ready", () => {
  const item = newEscalationQuota("code-585", "name-315");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("EscalationQuota rejects moves from stopped", () => {
  const item = newEscalationQuota("code-585", "name-315");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
