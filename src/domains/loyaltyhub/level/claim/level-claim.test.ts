import assert from "node:assert/strict";
import { test } from "node:test";
import { newLevelClaim } from "./level-claim.js";

test("LevelClaim starts in proposed", () => {
  const item = newLevelClaim("code-844", "title-421");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LevelClaim moves to rejected", () => {
  const item = newLevelClaim("code-844", "title-421");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("LevelClaim rejects moves from withdrawn", () => {
  const item = newLevelClaim("code-844", "title-421");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
