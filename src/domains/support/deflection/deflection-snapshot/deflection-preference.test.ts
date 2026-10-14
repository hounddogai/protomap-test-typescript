import assert from "node:assert/strict";
import { test } from "node:test";
import { newDeflectionPreference } from "./deflection-preference.js";

test("DeflectionPreference starts in planned", () => {
  const item = newDeflectionPreference("code-811", "name-749");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DeflectionPreference moves to scheduled", () => {
  const item = newDeflectionPreference("code-811", "name-749");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("DeflectionPreference rejects moves from cancelled", () => {
  const item = newDeflectionPreference("code-811", "name-749");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
