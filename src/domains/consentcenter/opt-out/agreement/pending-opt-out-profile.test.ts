import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingOptOutProfile } from "./pending-opt-out-profile.js";

test("PendingOptOutProfile starts in draft", () => {
  const item = newPendingOptOutProfile("code-269", "name-299");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingOptOutProfile moves to suspended", () => {
  const item = newPendingOptOutProfile("code-269", "name-299");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("PendingOptOutProfile rejects moves from closed", () => {
  const item = newPendingOptOutProfile("code-269", "name-299");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
