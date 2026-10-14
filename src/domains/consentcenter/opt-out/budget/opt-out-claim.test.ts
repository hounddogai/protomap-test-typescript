import assert from "node:assert/strict";
import { test } from "node:test";
import { newOptOutClaim } from "./opt-out-claim.js";

test("OptOutClaim starts in planned", () => {
  const item = newOptOutClaim("code-558", "name-183");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("OptOutClaim moves to in progress", () => {
  const item = newOptOutClaim("code-558", "name-183");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("OptOutClaim rejects moves from cancelled", () => {
  const item = newOptOutClaim("code-558", "name-183");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
