import assert from "node:assert/strict";
import { test } from "node:test";
import { newDoubleOptInClaim } from "./double-opt-in-claim.js";

test("DoubleOptInClaim starts in created", () => {
  const item = newDoubleOptInClaim("code-848", "name-25");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DoubleOptInClaim moves to validated", () => {
  const item = newDoubleOptInClaim("code-848", "name-25");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("DoubleOptInClaim rejects moves from retired", () => {
  const item = newDoubleOptInClaim("code-848", "name-25");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
