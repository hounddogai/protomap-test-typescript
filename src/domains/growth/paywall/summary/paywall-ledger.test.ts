import assert from "node:assert/strict";
import { test } from "node:test";
import { newPaywallLedger } from "./paywall-ledger.js";

test("PaywallLedger starts in created", () => {
  const item = newPaywallLedger("code-381", "title-438");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PaywallLedger moves to published", () => {
  const item = newPaywallLedger("code-381", "title-438");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("PaywallLedger rejects moves from retired", () => {
  const item = newPaywallLedger("code-381", "title-438");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
