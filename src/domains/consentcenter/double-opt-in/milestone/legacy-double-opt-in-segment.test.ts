import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyDoubleOptInSegment } from "./legacy-double-opt-in-segment.js";

test("LegacyDoubleOptInSegment starts in requested", () => {
  const item = newLegacyDoubleOptInSegment("code-773", "title-159");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyDoubleOptInSegment moves to granted", () => {
  const item = newLegacyDoubleOptInSegment("code-773", "title-159");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("LegacyDoubleOptInSegment rejects moves from expired", () => {
  const item = newLegacyDoubleOptInSegment("code-773", "title-159");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
