import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledSlaRule } from "./scheduled-sla-rule.js";

test("ScheduledSlaRule starts in draft", () => {
  const item = newScheduledSlaRule("code-718", "title-388");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledSlaRule moves to pending", () => {
  const item = newScheduledSlaRule("code-718", "title-388");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("ScheduledSlaRule rejects moves from closed", () => {
  const item = newScheduledSlaRule("code-718", "title-388");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
