import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientLevelRecord } from "./lenient-level-record.js";

test("LenientLevelRecord starts in idle", () => {
  const item = newLenientLevelRecord("code-262", "name-632");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientLevelRecord moves to warming", () => {
  const item = newLenientLevelRecord("code-262", "name-632");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("LenientLevelRecord rejects moves from stopped", () => {
  const item = newLenientLevelRecord("code-262", "name-632");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
