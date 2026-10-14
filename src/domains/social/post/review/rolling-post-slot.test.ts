import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingPostSlot } from "./rolling-post-slot.js";

test("RollingPostSlot starts in proposed", () => {
  const item = newRollingPostSlot("code-401", "name-449");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingPostSlot moves to withdrawn", () => {
  const item = newRollingPostSlot("code-401", "name-449");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("RollingPostSlot rejects moves from withdrawn", () => {
  const item = newRollingPostSlot("code-401", "name-449");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
