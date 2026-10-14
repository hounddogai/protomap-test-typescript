import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPaywallLedgerEngine } from "./paywall-ledger-engine.js";
import { newPaywallLedger } from "./paywall-ledger.js";

test("PaywallLedgerEngine keeps results within bounds", () => {
  const engine = defaultPaywallLedgerEngine();
  const item = newPaywallLedger("code-381", "title-438");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
