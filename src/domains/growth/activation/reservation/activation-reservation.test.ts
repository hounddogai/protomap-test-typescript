import assert from "node:assert/strict";
import { test } from "node:test";
import { newActivationReservation } from "./activation-reservation.js";

test("ActivationReservation starts in created", () => {
  const item = newActivationReservation("code-797", "label-798");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ActivationReservation moves to validated", () => {
  const item = newActivationReservation("code-797", "label-798");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("ActivationReservation rejects moves from retired", () => {
  const item = newActivationReservation("code-797", "label-798");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
