import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreativeScore } from "./creative-score.js";

test("CreativeScore starts in planned", () => {
  const item = newCreativeScore("code-644", "name-295");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreativeScore moves to completed", () => {
  const item = newCreativeScore("code-644", "name-295");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("CreativeScore rejects moves from cancelled", () => {
  const item = newCreativeScore("code-644", "name-295");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
