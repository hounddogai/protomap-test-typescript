import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalQueueAgreement } from "./global-queue-agreement.js";

test("GlobalQueueAgreement starts in proposed", () => {
  const item = newGlobalQueueAgreement("code-774", "label-453");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalQueueAgreement moves to rejected", () => {
  const item = newGlobalQueueAgreement("code-774", "label-453");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("GlobalQueueAgreement rejects moves from withdrawn", () => {
  const item = newGlobalQueueAgreement("code-774", "label-453");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
