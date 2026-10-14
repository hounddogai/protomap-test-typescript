import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientPaywallEntry } from "./lenient-paywall-entry.js";

test("LenientPaywallEntry starts in created", () => {
  const item = newLenientPaywallEntry("code-433", "title-18");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientPaywallEntry moves to validated", () => {
  const item = newLenientPaywallEntry("code-433", "title-18");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("LenientPaywallEntry rejects moves from retired", () => {
  const item = newLenientPaywallEntry("code-433", "title-18");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
