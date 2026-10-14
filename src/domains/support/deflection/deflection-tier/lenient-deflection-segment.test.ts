import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientDeflectionSegment } from "./lenient-deflection-segment.js";

test("LenientDeflectionSegment starts in idle", () => {
  const item = newLenientDeflectionSegment("code-176", "name-488");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientDeflectionSegment moves to warming", () => {
  const item = newLenientDeflectionSegment("code-176", "name-488");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("LenientDeflectionSegment rejects moves from stopped", () => {
  const item = newLenientDeflectionSegment("code-176", "name-488");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
