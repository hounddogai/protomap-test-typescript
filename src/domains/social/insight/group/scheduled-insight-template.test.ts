import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledInsightTemplate } from "./scheduled-insight-template.js";

test("ScheduledInsightTemplate starts in new", () => {
  const item = newScheduledInsightTemplate("code-22", "title-572");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledInsightTemplate moves to queued", () => {
  const item = newScheduledInsightTemplate("code-22", "title-572");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("ScheduledInsightTemplate rejects moves from failed", () => {
  const item = newScheduledInsightTemplate("code-22", "title-572");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
