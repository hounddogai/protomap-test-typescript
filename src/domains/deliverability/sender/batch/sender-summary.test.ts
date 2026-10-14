import assert from "node:assert/strict";
import { test } from "node:test";
import { newSenderSummary } from "./sender-summary.js";

test("SenderSummary starts in open", () => {
  const item = newSenderSummary("code-616", "name-239");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SenderSummary moves to reopened", () => {
  const item = newSenderSummary("code-616", "name-239");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("SenderSummary rejects moves from archived", () => {
  const item = newSenderSummary("code-616", "name-239");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
