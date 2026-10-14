import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingPathRecord } from "./pending-path-record.js";

test("PendingPathRecord starts in open", () => {
  const item = newPendingPathRecord("code-820", "label-958");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingPathRecord moves to in review", () => {
  const item = newPendingPathRecord("code-820", "label-958");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("PendingPathRecord rejects moves from archived", () => {
  const item = newPendingPathRecord("code-820", "label-958");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
