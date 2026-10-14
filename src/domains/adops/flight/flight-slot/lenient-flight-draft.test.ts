import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientFlightDraft } from "./lenient-flight-draft.js";

test("LenientFlightDraft starts in idle", () => {
  const item = newLenientFlightDraft("code-989", "name-686");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientFlightDraft moves to draining", () => {
  const item = newLenientFlightDraft("code-989", "name-686");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("LenientFlightDraft rejects moves from stopped", () => {
  const item = newLenientFlightDraft("code-989", "name-686");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
