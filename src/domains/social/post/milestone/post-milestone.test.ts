import assert from "node:assert/strict";
import { test } from "node:test";
import { newPostMilestone } from "./post-milestone.js";

test("PostMilestone starts in created", () => {
  const item = newPostMilestone("code-150", "name-921");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PostMilestone moves to validated", () => {
  const item = newPostMilestone("code-150", "name-921");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("PostMilestone rejects moves from retired", () => {
  const item = newPostMilestone("code-150", "name-921");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
