import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackCreditSlot } from "./fallback-credit-slot.js";

test("FallbackCreditSlot starts in created", () => {
  const item = newFallbackCreditSlot("code-765", "name-924");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackCreditSlot moves to validated", () => {
  const item = newFallbackCreditSlot("code-765", "name-924");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("FallbackCreditSlot rejects moves from retired", () => {
  const item = newFallbackCreditSlot("code-765", "name-924");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
