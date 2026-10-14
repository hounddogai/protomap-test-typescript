import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyFraudCheckEstimate } from "./legacy-fraud-check-estimate.js";

test("LegacyFraudCheckEstimate starts in requested", () => {
  const item = newLegacyFraudCheckEstimate("code-27", "name-408");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyFraudCheckEstimate moves to expired", () => {
  const item = newLegacyFraudCheckEstimate("code-27", "name-408");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("LegacyFraudCheckEstimate rejects moves from expired", () => {
  const item = newLegacyFraudCheckEstimate("code-27", "name-408");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
