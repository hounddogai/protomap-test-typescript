import assert from "node:assert/strict";
import { test } from "node:test";
import { newLevelBaseline } from "./level-baseline.js";

test("LevelBaseline starts in created", () => {
  const item = newLevelBaseline("code-70", "title-340");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LevelBaseline moves to validated", () => {
  const item = newLevelBaseline("code-70", "title-340");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("LevelBaseline rejects moves from retired", () => {
  const item = newLevelBaseline("code-70", "title-340");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
