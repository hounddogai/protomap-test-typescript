import assert from "node:assert/strict";
import { test } from "node:test";
import { newDeflectionGroup } from "./deflection-group.js";

test("DeflectionGroup starts in planned", () => {
  const item = newDeflectionGroup("code-217", "title-389");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DeflectionGroup moves to cancelled", () => {
  const item = newDeflectionGroup("code-217", "title-389");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("DeflectionGroup rejects moves from cancelled", () => {
  const item = newDeflectionGroup("code-217", "title-389");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
