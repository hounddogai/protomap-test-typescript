import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultPacingSummary } from "./default-pacing-summary.js";

test("DefaultPacingSummary starts in open", () => {
  const item = newDefaultPacingSummary("code-563", "label-729");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultPacingSummary moves to reopened", () => {
  const item = newDefaultPacingSummary("code-563", "label-729");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("DefaultPacingSummary rejects moves from archived", () => {
  const item = newDefaultPacingSummary("code-563", "label-729");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
