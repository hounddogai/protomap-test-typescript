import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledSuppressionQuota } from "./scheduled-suppression-quota.js";

test("ScheduledSuppressionQuota starts in created", () => {
  const item = newScheduledSuppressionQuota("code-857", "title-269");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledSuppressionQuota moves to validated", () => {
  const item = newScheduledSuppressionQuota("code-857", "title-269");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("ScheduledSuppressionQuota rejects moves from retired", () => {
  const item = newScheduledSuppressionQuota("code-857", "title-269");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
