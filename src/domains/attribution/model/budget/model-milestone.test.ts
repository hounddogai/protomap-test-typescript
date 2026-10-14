import assert from "node:assert/strict";
import { test } from "node:test";
import { newModelMilestone } from "./model-milestone.js";

test("ModelMilestone starts in created", () => {
  const item = newModelMilestone("code-821", "name-625");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ModelMilestone moves to retired", () => {
  const item = newModelMilestone("code-821", "name-625");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("ModelMilestone rejects moves from retired", () => {
  const item = newModelMilestone("code-821", "name-625");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
