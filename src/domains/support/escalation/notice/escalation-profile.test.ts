import assert from "node:assert/strict";
import { test } from "node:test";
import { newEscalationProfile } from "./escalation-profile.js";

test("EscalationProfile starts in created", () => {
  const item = newEscalationProfile("code-351", "title-756");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EscalationProfile moves to validated", () => {
  const item = newEscalationProfile("code-351", "title-756");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("EscalationProfile rejects moves from retired", () => {
  const item = newEscalationProfile("code-351", "title-756");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
