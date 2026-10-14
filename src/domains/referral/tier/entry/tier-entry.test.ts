import assert from "node:assert/strict";
import { test } from "node:test";
import { newTierEntry } from "./tier-entry.js";

test("TierEntry starts in new", () => {
  const item = newTierEntry("code-63", "name-725");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TierEntry moves to done", () => {
  const item = newTierEntry("code-63", "name-725");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("TierEntry rejects moves from failed", () => {
  const item = newTierEntry("code-63", "name-725");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
