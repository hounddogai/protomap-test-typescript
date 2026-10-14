import assert from "node:assert/strict";
import { test } from "node:test";
import { newLevelSnapshot } from "./level-snapshot.js";

test("LevelSnapshot starts in new", () => {
  const item = newLevelSnapshot("code-683", "title-70");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LevelSnapshot moves to done", () => {
  const item = newLevelSnapshot("code-683", "title-70");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("LevelSnapshot rejects moves from failed", () => {
  const item = newLevelSnapshot("code-683", "title-70");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
