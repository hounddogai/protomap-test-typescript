import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackSenderProfile } from "./fallback-sender-profile.js";

test("FallbackSenderProfile starts in planned", () => {
  const item = newFallbackSenderProfile("code-530", "label-720");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackSenderProfile moves to completed", () => {
  const item = newFallbackSenderProfile("code-530", "label-720");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("FallbackSenderProfile rejects moves from cancelled", () => {
  const item = newFallbackSenderProfile("code-530", "label-720");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
