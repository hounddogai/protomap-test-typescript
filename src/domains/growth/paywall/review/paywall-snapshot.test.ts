import assert from "node:assert/strict";
import { test } from "node:test";
import { newPaywallSnapshot } from "./paywall-snapshot.js";

test("PaywallSnapshot starts in proposed", () => {
  const item = newPaywallSnapshot("code-897", "label-931");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PaywallSnapshot moves to approved", () => {
  const item = newPaywallSnapshot("code-897", "label-931");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("PaywallSnapshot rejects moves from withdrawn", () => {
  const item = newPaywallSnapshot("code-897", "label-931");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
