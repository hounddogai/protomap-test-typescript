import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalPaywallSnapshot } from "./regional-paywall-snapshot.js";

test("RegionalPaywallSnapshot starts in new", () => {
  const item = newRegionalPaywallSnapshot("code-84", "label-728");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalPaywallSnapshot moves to failed", () => {
  const item = newRegionalPaywallSnapshot("code-84", "label-728");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("RegionalPaywallSnapshot rejects moves from failed", () => {
  const item = newRegionalPaywallSnapshot("code-84", "label-728");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
