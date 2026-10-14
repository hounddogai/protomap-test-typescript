import assert from "node:assert/strict";
import { test } from "node:test";
import { newDeflectionSegment } from "./deflection-segment.js";

test("DeflectionSegment starts in created", () => {
  const item = newDeflectionSegment("code-355", "name-661");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DeflectionSegment moves to validated", () => {
  const item = newDeflectionSegment("code-355", "name-661");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("DeflectionSegment rejects moves from retired", () => {
  const item = newDeflectionSegment("code-355", "name-661");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
