import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingDoubleOptInRollup } from "./pending-double-opt-in-rollup.js";

test("PendingDoubleOptInRollup starts in open", () => {
  const item = newPendingDoubleOptInRollup("code-326", "title-612");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingDoubleOptInRollup moves to in review", () => {
  const item = newPendingDoubleOptInRollup("code-326", "title-612");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("PendingDoubleOptInRollup rejects moves from archived", () => {
  const item = newPendingDoubleOptInRollup("code-326", "title-612");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
