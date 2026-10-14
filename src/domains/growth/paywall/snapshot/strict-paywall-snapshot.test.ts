import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictPaywallSnapshot } from "./strict-paywall-snapshot.js";

test("StrictPaywallSnapshot starts in draft", () => {
  const item = newStrictPaywallSnapshot("code-565", "title-914");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictPaywallSnapshot moves to pending", () => {
  const item = newStrictPaywallSnapshot("code-565", "title-914");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("StrictPaywallSnapshot rejects moves from closed", () => {
  const item = newStrictPaywallSnapshot("code-565", "title-914");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
