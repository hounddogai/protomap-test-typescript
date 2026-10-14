import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredDeflectionSegment } from "./tiered-deflection-segment.js";

test("TieredDeflectionSegment starts in created", () => {
  const item = newTieredDeflectionSegment("code-665", "name-94");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredDeflectionSegment moves to retired", () => {
  const item = newTieredDeflectionSegment("code-665", "name-94");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("TieredDeflectionSegment rejects moves from retired", () => {
  const item = newTieredDeflectionSegment("code-665", "name-94");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
