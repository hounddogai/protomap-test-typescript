import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalStreakRecord } from "./global-streak-record.js";

test("GlobalStreakRecord starts in open", () => {
  const item = newGlobalStreakRecord("code-629", "name-935");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalStreakRecord moves to archived", () => {
  const item = newGlobalStreakRecord("code-629", "name-935");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("GlobalStreakRecord rejects moves from archived", () => {
  const item = newGlobalStreakRecord("code-629", "name-935");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
