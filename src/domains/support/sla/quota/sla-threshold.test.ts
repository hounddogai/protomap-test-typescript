import assert from "node:assert/strict";
import { test } from "node:test";
import { newSlaThreshold } from "./sla-threshold.js";

test("SlaThreshold starts in created", () => {
  const item = newSlaThreshold("code-932", "name-945");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SlaThreshold moves to published", () => {
  const item = newSlaThreshold("code-932", "name-945");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("SlaThreshold rejects moves from retired", () => {
  const item = newSlaThreshold("code-932", "name-945");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
