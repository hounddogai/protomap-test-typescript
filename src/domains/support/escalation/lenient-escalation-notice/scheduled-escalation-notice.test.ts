import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledEscalationNotice } from "./scheduled-escalation-notice.js";

test("ScheduledEscalationNotice starts in draft", () => {
  const item = newScheduledEscalationNotice("code-313", "label-498");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledEscalationNotice moves to active", () => {
  const item = newScheduledEscalationNotice("code-313", "label-498");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("ScheduledEscalationNotice rejects moves from closed", () => {
  const item = newScheduledEscalationNotice("code-313", "label-498");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
