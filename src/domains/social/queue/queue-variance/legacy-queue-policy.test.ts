import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyQueuePolicy } from "./legacy-queue-policy.js";

test("LegacyQueuePolicy starts in proposed", () => {
  const item = newLegacyQueuePolicy("code-388", "label-588");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyQueuePolicy moves to approved", () => {
  const item = newLegacyQueuePolicy("code-388", "label-588");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("LegacyQueuePolicy rejects moves from withdrawn", () => {
  const item = newLegacyQueuePolicy("code-388", "label-588");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
