import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingDoubleOptInDigest } from "./pending-double-opt-in-digest.js";

test("PendingDoubleOptInDigest starts in created", () => {
  const item = newPendingDoubleOptInDigest("code-600", "label-103");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingDoubleOptInDigest moves to validated", () => {
  const item = newPendingDoubleOptInDigest("code-600", "label-103");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("PendingDoubleOptInDigest rejects moves from retired", () => {
  const item = newPendingDoubleOptInDigest("code-600", "label-103");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
