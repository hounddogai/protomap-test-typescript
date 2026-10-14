import assert from "node:assert/strict";
import { test } from "node:test";
import { newTouchpointAssignment } from "./touchpoint-assignment.js";

test("TouchpointAssignment starts in created", () => {
  const item = newTouchpointAssignment("code-737", "label-858");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TouchpointAssignment moves to published", () => {
  const item = newTouchpointAssignment("code-737", "label-858");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("TouchpointAssignment rejects moves from retired", () => {
  const item = newTouchpointAssignment("code-737", "label-858");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
