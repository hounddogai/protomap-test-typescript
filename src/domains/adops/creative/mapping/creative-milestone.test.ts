import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreativeMilestone } from "./creative-milestone.js";

test("CreativeMilestone starts in planned", () => {
  const item = newCreativeMilestone("code-696", "name-621");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreativeMilestone moves to in progress", () => {
  const item = newCreativeMilestone("code-696", "name-621");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("CreativeMilestone rejects moves from cancelled", () => {
  const item = newCreativeMilestone("code-696", "name-621");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
