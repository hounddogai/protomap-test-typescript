import assert from "node:assert/strict";
import { test } from "node:test";
import { newOptOutPreference } from "./opt-out-preference.js";

test("OptOutPreference starts in planned", () => {
  const item = newOptOutPreference("code-91", "label-284");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("OptOutPreference moves to cancelled", () => {
  const item = newOptOutPreference("code-91", "label-284");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("OptOutPreference rejects moves from cancelled", () => {
  const item = newOptOutPreference("code-91", "label-284");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
