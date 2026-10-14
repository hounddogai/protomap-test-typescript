import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultLevelEntry } from "./default-level-entry.js";

test("DefaultLevelEntry starts in created", () => {
  const item = newDefaultLevelEntry("code-768", "label-60");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultLevelEntry moves to retired", () => {
  const item = newDefaultLevelEntry("code-768", "label-60");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("DefaultLevelEntry rejects moves from retired", () => {
  const item = newDefaultLevelEntry("code-768", "label-60");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
