import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalSlaMilestone } from "./global-sla-milestone.js";

test("GlobalSlaMilestone starts in planned", () => {
  const item = newGlobalSlaMilestone("code-610", "label-606");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalSlaMilestone moves to in progress", () => {
  const item = newGlobalSlaMilestone("code-610", "label-606");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("GlobalSlaMilestone rejects moves from cancelled", () => {
  const item = newGlobalSlaMilestone("code-610", "label-606");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
