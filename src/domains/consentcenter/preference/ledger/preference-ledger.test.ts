import assert from "node:assert/strict";
import { test } from "node:test";
import { newPreferenceLedger } from "./preference-ledger.js";

test("PreferenceLedger starts in created", () => {
  const item = newPreferenceLedger("code-439", "title-62");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PreferenceLedger moves to published", () => {
  const item = newPreferenceLedger("code-439", "title-62");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("PreferenceLedger rejects moves from retired", () => {
  const item = newPreferenceLedger("code-439", "title-62");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
