import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualBadgeTier } from "./manual-badge-tier.js";

test("ManualBadgeTier starts in requested", () => {
  const item = newManualBadgeTier("code-910", "name-718");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualBadgeTier moves to granted", () => {
  const item = newManualBadgeTier("code-910", "name-718");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("ManualBadgeTier rejects moves from expired", () => {
  const item = newManualBadgeTier("code-910", "name-718");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
