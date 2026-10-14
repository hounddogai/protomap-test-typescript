import assert from "node:assert/strict";
import { test } from "node:test";
import { newPacingEntry } from "./pacing-entry.js";

test("PacingEntry starts in planned", () => {
  const item = newPacingEntry("code-831", "label-572");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PacingEntry moves to completed", () => {
  const item = newPacingEntry("code-831", "label-572");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("PacingEntry rejects moves from cancelled", () => {
  const item = newPacingEntry("code-831", "label-572");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
