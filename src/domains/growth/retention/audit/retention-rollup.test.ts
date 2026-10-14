import assert from "node:assert/strict";
import { test } from "node:test";
import { newRetentionRollup } from "./retention-rollup.js";

test("RetentionRollup starts in open", () => {
  const item = newRetentionRollup("code-745", "name-743");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RetentionRollup moves to resolved", () => {
  const item = newRetentionRollup("code-745", "name-743");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("RetentionRollup rejects moves from archived", () => {
  const item = newRetentionRollup("code-745", "name-743");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
