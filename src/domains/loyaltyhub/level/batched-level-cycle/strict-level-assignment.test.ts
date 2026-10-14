import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictLevelAssignment } from "./strict-level-assignment.js";

test("StrictLevelAssignment starts in open", () => {
  const item = newStrictLevelAssignment("code-26", "title-264");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictLevelAssignment moves to reopened", () => {
  const item = newStrictLevelAssignment("code-26", "title-264");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("StrictLevelAssignment rejects moves from archived", () => {
  const item = newStrictLevelAssignment("code-26", "title-264");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
