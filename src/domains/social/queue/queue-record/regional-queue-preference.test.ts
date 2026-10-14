import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalQueuePreference } from "./regional-queue-preference.js";

test("RegionalQueuePreference starts in planned", () => {
  const item = newRegionalQueuePreference("code-844", "name-614");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalQueuePreference moves to cancelled", () => {
  const item = newRegionalQueuePreference("code-844", "name-614");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("RegionalQueuePreference rejects moves from cancelled", () => {
  const item = newRegionalQueuePreference("code-844", "name-614");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
