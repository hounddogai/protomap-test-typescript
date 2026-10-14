import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultNudgeTier } from "./default-nudge-tier.js";

test("DefaultNudgeTier starts in created", () => {
  const item = newDefaultNudgeTier("code-733", "label-425");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultNudgeTier moves to validated", () => {
  const item = newDefaultNudgeTier("code-733", "label-425");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("DefaultNudgeTier rejects moves from retired", () => {
  const item = newDefaultNudgeTier("code-733", "label-425");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
