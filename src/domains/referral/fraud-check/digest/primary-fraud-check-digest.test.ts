import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryFraudCheckDigest } from "./primary-fraud-check-digest.js";

test("PrimaryFraudCheckDigest starts in new", () => {
  const item = newPrimaryFraudCheckDigest("code-512", "name-128");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryFraudCheckDigest moves to running", () => {
  const item = newPrimaryFraudCheckDigest("code-512", "name-128");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("PrimaryFraudCheckDigest rejects moves from failed", () => {
  const item = newPrimaryFraudCheckDigest("code-512", "name-128");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
