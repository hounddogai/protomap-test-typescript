import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledDeflectionRecord } from "./scheduled-deflection-record.js";

test("ScheduledDeflectionRecord starts in open", () => {
  const item = newScheduledDeflectionRecord("code-123", "label-323");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledDeflectionRecord moves to resolved", () => {
  const item = newScheduledDeflectionRecord("code-123", "label-323");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("ScheduledDeflectionRecord rejects moves from archived", () => {
  const item = newScheduledDeflectionRecord("code-123", "label-323");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
