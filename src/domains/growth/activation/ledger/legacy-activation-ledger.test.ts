import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyActivationLedger } from "./legacy-activation-ledger.js";

test("LegacyActivationLedger starts in created", () => {
  const item = newLegacyActivationLedger("code-40", "title-521");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyActivationLedger moves to published", () => {
  const item = newLegacyActivationLedger("code-40", "title-521");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("LegacyActivationLedger rejects moves from retired", () => {
  const item = newLegacyActivationLedger("code-40", "title-521");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
