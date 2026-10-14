import assert from "node:assert/strict";
import { test } from "node:test";
import { newFraudCheckDigest } from "./fraud-check-digest.js";

test("FraudCheckDigest starts in planned", () => {
  const item = newFraudCheckDigest("code-835", "name-391");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FraudCheckDigest moves to scheduled", () => {
  const item = newFraudCheckDigest("code-835", "name-391");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("FraudCheckDigest rejects moves from cancelled", () => {
  const item = newFraudCheckDigest("code-835", "name-391");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
