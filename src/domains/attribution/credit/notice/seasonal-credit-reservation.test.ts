import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalCreditReservation } from "./seasonal-credit-reservation.js";

test("SeasonalCreditReservation starts in open", () => {
  const item = newSeasonalCreditReservation("code-874", "label-759");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalCreditReservation moves to resolved", () => {
  const item = newSeasonalCreditReservation("code-874", "label-759");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("SeasonalCreditReservation rejects moves from archived", () => {
  const item = newSeasonalCreditReservation("code-874", "label-759");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
