import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalSenderBatch } from "./regional-sender-batch.js";

test("RegionalSenderBatch starts in new", () => {
  const item = newRegionalSenderBatch("code-692", "label-10");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalSenderBatch moves to running", () => {
  const item = newRegionalSenderBatch("code-692", "label-10");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("RegionalSenderBatch rejects moves from failed", () => {
  const item = newRegionalSenderBatch("code-692", "label-10");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
