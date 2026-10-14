import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictSenderProfile } from "./strict-sender-profile.js";

test("StrictSenderProfile starts in planned", () => {
  const item = newStrictSenderProfile("code-498", "title-45");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictSenderProfile moves to cancelled", () => {
  const item = newStrictSenderProfile("code-498", "title-45");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("StrictSenderProfile rejects moves from cancelled", () => {
  const item = newStrictSenderProfile("code-498", "title-45");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
