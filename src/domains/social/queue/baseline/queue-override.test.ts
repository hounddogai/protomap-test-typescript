import assert from "node:assert/strict";
import { test } from "node:test";
import { newQueueOverride } from "./queue-override.js";

test("QueueOverride starts in created", () => {
  const item = newQueueOverride("code-795", "name-447");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("QueueOverride moves to validated", () => {
  const item = newQueueOverride("code-795", "name-447");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("QueueOverride rejects moves from retired", () => {
  const item = newQueueOverride("code-795", "name-447");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
