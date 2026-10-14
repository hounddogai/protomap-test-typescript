import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardReservation } from "./reward-reservation.js";

test("RewardReservation starts in open", () => {
  const item = newRewardReservation("code-483", "name-962");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardReservation moves to archived", () => {
  const item = newRewardReservation("code-483", "name-962");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("RewardReservation rejects moves from archived", () => {
  const item = newRewardReservation("code-483", "name-962");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
