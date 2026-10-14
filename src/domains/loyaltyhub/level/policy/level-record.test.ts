import assert from "node:assert/strict";
import { test } from "node:test";
import { newLevelRecord } from "./level-record.js";

test("LevelRecord starts in proposed", () => {
  const item = newLevelRecord("code-891", "label-132");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LevelRecord moves to rejected", () => {
  const item = newLevelRecord("code-891", "label-132");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("LevelRecord rejects moves from withdrawn", () => {
  const item = newLevelRecord("code-891", "label-132");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
