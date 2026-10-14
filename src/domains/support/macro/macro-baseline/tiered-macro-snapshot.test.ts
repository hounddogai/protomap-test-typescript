import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredMacroSnapshot } from "./tiered-macro-snapshot.js";

test("TieredMacroSnapshot starts in proposed", () => {
  const item = newTieredMacroSnapshot("code-450", "name-767");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredMacroSnapshot moves to approved", () => {
  const item = newTieredMacroSnapshot("code-450", "name-767");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("TieredMacroSnapshot rejects moves from withdrawn", () => {
  const item = newTieredMacroSnapshot("code-450", "name-767");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
