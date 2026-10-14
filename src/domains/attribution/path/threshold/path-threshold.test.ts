import assert from "node:assert/strict";
import { test } from "node:test";
import { newPathThreshold } from "./path-threshold.js";

test("PathThreshold starts in draft", () => {
  const item = newPathThreshold("code-48", "name-445");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PathThreshold moves to active", () => {
  const item = newPathThreshold("code-48", "name-445");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("PathThreshold rejects moves from closed", () => {
  const item = newPathThreshold("code-48", "name-445");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
