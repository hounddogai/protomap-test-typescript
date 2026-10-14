import assert from "node:assert/strict";
import { test } from "node:test";
import { newStreakBundle } from "./streak-bundle.js";

test("StreakBundle starts in proposed", () => {
  const item = newStreakBundle("code-94", "title-730");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StreakBundle moves to rejected", () => {
  const item = newStreakBundle("code-94", "title-730");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("StreakBundle rejects moves from withdrawn", () => {
  const item = newStreakBundle("code-94", "title-730");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
