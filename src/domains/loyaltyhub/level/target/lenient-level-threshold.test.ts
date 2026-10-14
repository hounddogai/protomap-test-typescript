import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientLevelThreshold } from "./lenient-level-threshold.js";

test("LenientLevelThreshold starts in draft", () => {
  const item = newLenientLevelThreshold("code-370", "title-320");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientLevelThreshold moves to active", () => {
  const item = newLenientLevelThreshold("code-370", "title-320");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("LenientLevelThreshold rejects moves from closed", () => {
  const item = newLenientLevelThreshold("code-370", "title-320");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
