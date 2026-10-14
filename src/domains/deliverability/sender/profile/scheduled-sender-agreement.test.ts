import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledSenderAgreement } from "./scheduled-sender-agreement.js";

test("ScheduledSenderAgreement starts in proposed", () => {
  const item = newScheduledSenderAgreement("code-748", "label-590");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledSenderAgreement moves to approved", () => {
  const item = newScheduledSenderAgreement("code-748", "label-590");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("ScheduledSenderAgreement rejects moves from withdrawn", () => {
  const item = newScheduledSenderAgreement("code-748", "label-590");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
