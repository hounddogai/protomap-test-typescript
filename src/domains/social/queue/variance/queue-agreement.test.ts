import assert from "node:assert/strict";
import { test } from "node:test";
import { newQueueAgreement } from "./queue-agreement.js";

test("QueueAgreement starts in created", () => {
  const item = newQueueAgreement("code-225", "label-169");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("QueueAgreement moves to published", () => {
  const item = newQueueAgreement("code-225", "label-169");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("QueueAgreement rejects moves from retired", () => {
  const item = newQueueAgreement("code-225", "label-169");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
