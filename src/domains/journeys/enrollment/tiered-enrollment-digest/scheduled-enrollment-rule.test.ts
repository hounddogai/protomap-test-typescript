import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledEnrollmentRule } from "./scheduled-enrollment-rule.js";

test("ScheduledEnrollmentRule starts in draft", () => {
  const item = newScheduledEnrollmentRule("code-664", "title-826");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledEnrollmentRule moves to active", () => {
  const item = newScheduledEnrollmentRule("code-664", "title-826");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("ScheduledEnrollmentRule rejects moves from closed", () => {
  const item = newScheduledEnrollmentRule("code-664", "title-826");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
