import assert from "node:assert/strict";
import { test } from "node:test";
import { newInviteForecast } from "./invite-forecast.js";

test("InviteForecast starts in open", () => {
  const item = newInviteForecast("code-64", "title-428");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InviteForecast moves to reopened", () => {
  const item = newInviteForecast("code-64", "title-428");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("InviteForecast rejects moves from archived", () => {
  const item = newInviteForecast("code-64", "title-428");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
