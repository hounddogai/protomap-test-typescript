import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedSenderProfile } from "./capped-sender-profile.js";

test("CappedSenderProfile starts in requested", () => {
  const item = newCappedSenderProfile("code-548", "name-240");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedSenderProfile moves to expired", () => {
  const item = newCappedSenderProfile("code-548", "name-240");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("CappedSenderProfile rejects moves from expired", () => {
  const item = newCappedSenderProfile("code-548", "name-240");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
