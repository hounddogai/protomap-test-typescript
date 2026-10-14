import assert from "node:assert/strict";
import { test } from "node:test";
import { newActivationLedger } from "./activation-ledger.js";

test("ActivationLedger starts in planned", () => {
  const item = newActivationLedger("code-873", "label-254");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ActivationLedger moves to completed", () => {
  const item = newActivationLedger("code-873", "label-254");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("ActivationLedger rejects moves from cancelled", () => {
  const item = newActivationLedger("code-873", "label-254");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
