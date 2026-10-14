import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledCreditBundle } from "./scheduled-credit-bundle.js";

test("ScheduledCreditBundle starts in new", () => {
  const item = newScheduledCreditBundle("code-723", "title-924");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledCreditBundle moves to queued", () => {
  const item = newScheduledCreditBundle("code-723", "title-924");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("ScheduledCreditBundle rejects moves from failed", () => {
  const item = newScheduledCreditBundle("code-723", "title-924");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
