import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictSuppressionPreference } from "./strict-suppression-preference.js";

test("StrictSuppressionPreference starts in requested", () => {
  const item = newStrictSuppressionPreference("code-793", "title-876");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictSuppressionPreference moves to granted", () => {
  const item = newStrictSuppressionPreference("code-793", "title-876");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("StrictSuppressionPreference rejects moves from expired", () => {
  const item = newStrictSuppressionPreference("code-793", "title-876");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
