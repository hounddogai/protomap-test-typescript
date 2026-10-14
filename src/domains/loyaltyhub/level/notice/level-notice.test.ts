import assert from "node:assert/strict";
import { test } from "node:test";
import { newLevelNotice } from "./level-notice.js";

test("LevelNotice starts in planned", () => {
  const item = newLevelNotice("code-167", "label-448");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LevelNotice moves to cancelled", () => {
  const item = newLevelNotice("code-167", "label-448");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("LevelNotice rejects moves from cancelled", () => {
  const item = newLevelNotice("code-167", "label-448");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
