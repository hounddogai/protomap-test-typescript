import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalProofProfile } from "./regional-proof-profile.js";

test("RegionalProofProfile starts in planned", () => {
  const item = newRegionalProofProfile("code-770", "name-570");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalProofProfile moves to in progress", () => {
  const item = newRegionalProofProfile("code-770", "name-570");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("RegionalProofProfile rejects moves from cancelled", () => {
  const item = newRegionalProofProfile("code-770", "name-570");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
