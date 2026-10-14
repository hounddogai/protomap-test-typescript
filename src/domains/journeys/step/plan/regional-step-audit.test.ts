import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalStepAudit } from "./regional-step-audit.js";

test("RegionalStepAudit starts in idle", () => {
  const item = newRegionalStepAudit("code-813", "title-187");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalStepAudit moves to warming", () => {
  const item = newRegionalStepAudit("code-813", "title-187");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("RegionalStepAudit rejects moves from stopped", () => {
  const item = newRegionalStepAudit("code-813", "title-187");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
