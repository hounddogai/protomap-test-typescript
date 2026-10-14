import assert from "node:assert/strict";
import { test } from "node:test";
import { newPaywallSummary } from "./paywall-summary.js";

test("PaywallSummary starts in proposed", () => {
  const item = newPaywallSummary("code-954", "label-748");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PaywallSummary moves to approved", () => {
  const item = newPaywallSummary("code-954", "label-748");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("PaywallSummary rejects moves from withdrawn", () => {
  const item = newPaywallSummary("code-954", "label-748");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
