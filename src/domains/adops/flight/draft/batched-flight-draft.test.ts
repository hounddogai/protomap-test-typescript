import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedFlightDraft } from "./batched-flight-draft.js";

test("BatchedFlightDraft starts in created", () => {
  const item = newBatchedFlightDraft("code-918", "title-478");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedFlightDraft moves to validated", () => {
  const item = newBatchedFlightDraft("code-918", "title-478");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("BatchedFlightDraft rejects moves from retired", () => {
  const item = newBatchedFlightDraft("code-918", "title-478");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
