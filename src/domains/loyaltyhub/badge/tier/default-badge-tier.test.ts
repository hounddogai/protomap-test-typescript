import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultBadgeTier } from "./default-badge-tier.js";

test("DefaultBadgeTier starts in planned", () => {
  const item = newDefaultBadgeTier("code-359", "label-800");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultBadgeTier moves to scheduled", () => {
  const item = newDefaultBadgeTier("code-359", "label-800");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("DefaultBadgeTier rejects moves from cancelled", () => {
  const item = newDefaultBadgeTier("code-359", "label-800");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
