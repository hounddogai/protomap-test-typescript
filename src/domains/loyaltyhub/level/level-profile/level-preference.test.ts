import assert from "node:assert/strict";
import { test } from "node:test";
import { newLevelPreference } from "./level-preference.js";

test("LevelPreference starts in requested", () => {
  const item = newLevelPreference("code-20", "title-379");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LevelPreference moves to granted", () => {
  const item = newLevelPreference("code-20", "title-379");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("LevelPreference rejects moves from expired", () => {
  const item = newLevelPreference("code-20", "title-379");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
