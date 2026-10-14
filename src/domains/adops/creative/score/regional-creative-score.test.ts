import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalCreativeScore } from "./regional-creative-score.js";

test("RegionalCreativeScore starts in open", () => {
  const item = newRegionalCreativeScore("code-152", "name-823");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalCreativeScore moves to resolved", () => {
  const item = newRegionalCreativeScore("code-152", "name-823");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("RegionalCreativeScore rejects moves from archived", () => {
  const item = newRegionalCreativeScore("code-152", "name-823");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
