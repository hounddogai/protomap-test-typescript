import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryConversionGroup } from "./primary-conversion-group.js";

test("PrimaryConversionGroup starts in idle", () => {
  const item = newPrimaryConversionGroup("code-9", "title-152");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryConversionGroup moves to warming", () => {
  const item = newPrimaryConversionGroup("code-9", "title-152");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("PrimaryConversionGroup rejects moves from stopped", () => {
  const item = newPrimaryConversionGroup("code-9", "title-152");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
