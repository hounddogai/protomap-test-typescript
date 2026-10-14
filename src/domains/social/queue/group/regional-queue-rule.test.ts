import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalQueueRule } from "./regional-queue-rule.js";

test("RegionalQueueRule starts in requested", () => {
  const item = newRegionalQueueRule("code-6", "name-241");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalQueueRule moves to granted", () => {
  const item = newRegionalQueueRule("code-6", "name-241");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("RegionalQueueRule rejects moves from expired", () => {
  const item = newRegionalQueueRule("code-6", "name-241");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
