import assert from "node:assert/strict";
import { test } from "node:test";
import { newSlaScore } from "./sla-score.js";

test("SlaScore starts in planned", () => {
  const item = newSlaScore("code-558", "title-226");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SlaScore moves to scheduled", () => {
  const item = newSlaScore("code-558", "title-226");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("SlaScore rejects moves from cancelled", () => {
  const item = newSlaScore("code-558", "title-226");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
