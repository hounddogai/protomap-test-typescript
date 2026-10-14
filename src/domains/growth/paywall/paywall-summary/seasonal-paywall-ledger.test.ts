import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalPaywallLedger } from "./seasonal-paywall-ledger.js";

test("SeasonalPaywallLedger starts in created", () => {
  const item = newSeasonalPaywallLedger("code-427", "title-111");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalPaywallLedger moves to validated", () => {
  const item = newSeasonalPaywallLedger("code-427", "title-111");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("SeasonalPaywallLedger rejects moves from retired", () => {
  const item = newSeasonalPaywallLedger("code-427", "title-111");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
