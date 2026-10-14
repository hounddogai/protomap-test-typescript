import assert from "node:assert/strict";
import { test } from "node:test";
import { newReputationRecord } from "./reputation-record.js";

test("ReputationRecord starts in requested", () => {
  const item = newReputationRecord("code-427", "label-979");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReputationRecord moves to granted", () => {
  const item = newReputationRecord("code-427", "label-979");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("ReputationRecord rejects moves from expired", () => {
  const item = newReputationRecord("code-427", "label-979");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
