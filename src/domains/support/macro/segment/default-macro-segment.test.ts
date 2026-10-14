import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultMacroSegment } from "./default-macro-segment.js";

test("DefaultMacroSegment starts in planned", () => {
  const item = newDefaultMacroSegment("code-511", "label-787");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultMacroSegment moves to in progress", () => {
  const item = newDefaultMacroSegment("code-511", "label-787");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("DefaultMacroSegment rejects moves from cancelled", () => {
  const item = newDefaultMacroSegment("code-511", "label-787");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
