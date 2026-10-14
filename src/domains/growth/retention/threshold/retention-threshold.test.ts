import assert from "node:assert/strict";
import { test } from "node:test";
import { newRetentionThreshold } from "./retention-threshold.js";

test("RetentionThreshold starts in proposed", () => {
  const item = newRetentionThreshold("code-664", "name-683");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RetentionThreshold moves to approved", () => {
  const item = newRetentionThreshold("code-664", "name-683");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("RetentionThreshold rejects moves from withdrawn", () => {
  const item = newRetentionThreshold("code-664", "name-683");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
