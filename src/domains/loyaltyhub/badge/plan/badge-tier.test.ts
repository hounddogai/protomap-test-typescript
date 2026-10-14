import assert from "node:assert/strict";
import { test } from "node:test";
import { newBadgeTier } from "./badge-tier.js";

test("BadgeTier starts in planned", () => {
  const item = newBadgeTier("code-302", "label-990");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BadgeTier moves to scheduled", () => {
  const item = newBadgeTier("code-302", "label-990");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("BadgeTier rejects moves from cancelled", () => {
  const item = newBadgeTier("code-302", "label-990");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
