import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalRewardEntry } from "./global-reward-entry.js";

test("GlobalRewardEntry starts in open", () => {
  const item = newGlobalRewardEntry("code-679", "name-489");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalRewardEntry moves to in review", () => {
  const item = newGlobalRewardEntry("code-679", "name-489");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("GlobalRewardEntry rejects moves from archived", () => {
  const item = newGlobalRewardEntry("code-679", "name-489");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
