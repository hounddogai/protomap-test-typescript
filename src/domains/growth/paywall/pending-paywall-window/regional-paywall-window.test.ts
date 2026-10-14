import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalPaywallWindow } from "./regional-paywall-window.js";

test("RegionalPaywallWindow starts in proposed", () => {
  const item = newRegionalPaywallWindow("code-101", "title-314");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalPaywallWindow moves to rejected", () => {
  const item = newRegionalPaywallWindow("code-101", "title-314");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("RegionalPaywallWindow rejects moves from withdrawn", () => {
  const item = newRegionalPaywallWindow("code-101", "title-314");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
