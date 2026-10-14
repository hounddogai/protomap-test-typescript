import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackDeflectionSegment } from "./fallback-deflection-segment.js";

test("FallbackDeflectionSegment starts in new", () => {
  const item = newFallbackDeflectionSegment("code-471", "name-336");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackDeflectionSegment moves to running", () => {
  const item = newFallbackDeflectionSegment("code-471", "name-336");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("FallbackDeflectionSegment rejects moves from failed", () => {
  const item = newFallbackDeflectionSegment("code-471", "name-336");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
