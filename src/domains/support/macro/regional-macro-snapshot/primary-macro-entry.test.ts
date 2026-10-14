import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryMacroEntry } from "./primary-macro-entry.js";

test("PrimaryMacroEntry starts in requested", () => {
  const item = newPrimaryMacroEntry("code-679", "name-79");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryMacroEntry moves to granted", () => {
  const item = newPrimaryMacroEntry("code-679", "name-79");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("PrimaryMacroEntry rejects moves from expired", () => {
  const item = newPrimaryMacroEntry("code-679", "name-79");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
