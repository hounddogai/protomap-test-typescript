import assert from "node:assert/strict";
import { test } from "node:test";
import { toRewardReservationView, toRewardReservationViews } from "./reward-reservation-view.js";
import { newRewardReservation } from "./reward-reservation.js";

test("RewardReservationView shows the status in capitals", () => {
  const item = newRewardReservation("code-483", "name-962");
  const view = toRewardReservationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRewardReservationViews([item, item]).length, 2, "views");
});
