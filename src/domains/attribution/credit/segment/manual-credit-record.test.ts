import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualCreditRecord } from "./manual-credit-record.js";

test("ManualCreditRecord starts in requested", () => {
  const item = newManualCreditRecord("code-374", "name-896");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualCreditRecord moves to granted", () => {
  const item = newManualCreditRecord("code-374", "name-896");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("ManualCreditRecord rejects moves from expired", () => {
  const item = newManualCreditRecord("code-374", "name-896");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
