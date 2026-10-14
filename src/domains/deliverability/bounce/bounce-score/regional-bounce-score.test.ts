import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalBounceScore } from "./regional-bounce-score.js";

test("RegionalBounceScore starts in proposed", () => {
  const item = newRegionalBounceScore("code-229", "title-125");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalBounceScore moves to approved", () => {
  const item = newRegionalBounceScore("code-229", "title-125");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("RegionalBounceScore rejects moves from withdrawn", () => {
  const item = newRegionalBounceScore("code-229", "title-125");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
