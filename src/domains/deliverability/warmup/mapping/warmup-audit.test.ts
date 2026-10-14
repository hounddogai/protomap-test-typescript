import assert from "node:assert/strict";
import { test } from "node:test";
import { newWarmupAudit } from "./warmup-audit.js";

test("WarmupAudit starts in draft", () => {
  const item = newWarmupAudit("code-951", "label-848");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WarmupAudit moves to pending", () => {
  const item = newWarmupAudit("code-951", "label-848");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("WarmupAudit rejects moves from closed", () => {
  const item = newWarmupAudit("code-951", "label-848");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
