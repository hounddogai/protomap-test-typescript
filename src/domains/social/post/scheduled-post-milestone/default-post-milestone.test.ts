import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultPostMilestone } from "./default-post-milestone.js";

test("DefaultPostMilestone starts in proposed", () => {
  const item = newDefaultPostMilestone("code-600", "name-508");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultPostMilestone moves to approved", () => {
  const item = newDefaultPostMilestone("code-600", "name-508");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("DefaultPostMilestone rejects moves from withdrawn", () => {
  const item = newDefaultPostMilestone("code-600", "name-508");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
