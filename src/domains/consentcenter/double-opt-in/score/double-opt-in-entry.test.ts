import assert from "node:assert/strict";
import { test } from "node:test";
import { newDoubleOptInEntry } from "./double-opt-in-entry.js";

test("DoubleOptInEntry starts in new", () => {
  const item = newDoubleOptInEntry("code-506", "name-93");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DoubleOptInEntry moves to running", () => {
  const item = newDoubleOptInEntry("code-506", "name-93");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("DoubleOptInEntry rejects moves from failed", () => {
  const item = newDoubleOptInEntry("code-506", "name-93");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
