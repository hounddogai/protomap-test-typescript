import assert from "node:assert/strict";
import { test } from "node:test";
import { newLevelOverride } from "./level-override.js";

test("LevelOverride starts in proposed", () => {
  const item = newLevelOverride("code-768", "title-878");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LevelOverride moves to rejected", () => {
  const item = newLevelOverride("code-768", "title-878");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("LevelOverride rejects moves from withdrawn", () => {
  const item = newLevelOverride("code-768", "title-878");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
