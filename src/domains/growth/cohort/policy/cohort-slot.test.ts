import assert from "node:assert/strict";
import { test } from "node:test";
import { newCohortSlot } from "./cohort-slot.js";

test("CohortSlot starts in new", () => {
  const item = newCohortSlot("code-362", "label-838");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CohortSlot moves to done", () => {
  const item = newCohortSlot("code-362", "label-838");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("CohortSlot rejects moves from failed", () => {
  const item = newCohortSlot("code-362", "label-838");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
