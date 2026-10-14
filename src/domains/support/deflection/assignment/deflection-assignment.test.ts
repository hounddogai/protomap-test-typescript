import assert from "node:assert/strict";
import { test } from "node:test";
import { newDeflectionAssignment } from "./deflection-assignment.js";

test("DeflectionAssignment starts in draft", () => {
  const item = newDeflectionAssignment("code-657", "title-878");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DeflectionAssignment moves to active", () => {
  const item = newDeflectionAssignment("code-657", "title-878");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("DeflectionAssignment rejects moves from closed", () => {
  const item = newDeflectionAssignment("code-657", "title-878");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
