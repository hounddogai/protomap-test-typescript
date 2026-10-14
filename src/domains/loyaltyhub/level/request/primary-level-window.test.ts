import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryLevelWindow } from "./primary-level-window.js";

test("PrimaryLevelWindow starts in planned", () => {
  const item = newPrimaryLevelWindow("code-541", "name-879");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryLevelWindow moves to completed", () => {
  const item = newPrimaryLevelWindow("code-541", "name-879");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("PrimaryLevelWindow rejects moves from cancelled", () => {
  const item = newPrimaryLevelWindow("code-541", "name-879");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
