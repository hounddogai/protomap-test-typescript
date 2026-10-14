import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictOptOutProfile } from "./strict-opt-out-profile.js";

test("StrictOptOutProfile starts in planned", () => {
  const item = newStrictOptOutProfile("code-538", "name-613");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictOptOutProfile moves to in progress", () => {
  const item = newStrictOptOutProfile("code-538", "name-613");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("StrictOptOutProfile rejects moves from cancelled", () => {
  const item = newStrictOptOutProfile("code-538", "name-613");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
