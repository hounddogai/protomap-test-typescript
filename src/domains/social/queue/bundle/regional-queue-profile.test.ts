import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalQueueProfile } from "./regional-queue-profile.js";

test("RegionalQueueProfile starts in open", () => {
  const item = newRegionalQueueProfile("code-171", "name-113");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalQueueProfile moves to resolved", () => {
  const item = newRegionalQueueProfile("code-171", "name-113");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("RegionalQueueProfile rejects moves from archived", () => {
  const item = newRegionalQueueProfile("code-171", "name-113");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
