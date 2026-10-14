import assert from "node:assert/strict";
import { test } from "node:test";
import { newReputationNotice } from "./reputation-notice.js";

test("ReputationNotice starts in created", () => {
  const item = newReputationNotice("code-544", "label-432");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReputationNotice moves to retired", () => {
  const item = newReputationNotice("code-544", "label-432");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("ReputationNotice rejects moves from retired", () => {
  const item = newReputationNotice("code-544", "label-432");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
