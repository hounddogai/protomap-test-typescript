import assert from "node:assert/strict";
import { test } from "node:test";
import { newBadgeVariance } from "./badge-variance.js";

test("BadgeVariance starts in new", () => {
  const item = newBadgeVariance("code-262", "name-445");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BadgeVariance moves to done", () => {
  const item = newBadgeVariance("code-262", "name-445");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("BadgeVariance rejects moves from failed", () => {
  const item = newBadgeVariance("code-262", "name-445");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
