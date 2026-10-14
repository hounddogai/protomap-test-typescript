import assert from "node:assert/strict";
import { test } from "node:test";
import { newSlaRollup } from "./sla-rollup.js";

test("SlaRollup starts in new", () => {
  const item = newSlaRollup("code-715", "label-270");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SlaRollup moves to failed", () => {
  const item = newSlaRollup("code-715", "label-270");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("SlaRollup rejects moves from failed", () => {
  const item = newSlaRollup("code-715", "label-270");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
