import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalQueueTarget } from "./regional-queue-target.js";

test("RegionalQueueTarget starts in new", () => {
  const item = newRegionalQueueTarget("code-792", "name-286");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalQueueTarget moves to failed", () => {
  const item = newRegionalQueueTarget("code-792", "name-286");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("RegionalQueueTarget rejects moves from failed", () => {
  const item = newRegionalQueueTarget("code-792", "name-286");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
