import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingActivationSchedule } from "./pending-activation-schedule.js";

test("PendingActivationSchedule starts in requested", () => {
  const item = newPendingActivationSchedule("code-418", "label-117");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingActivationSchedule moves to revoked", () => {
  const item = newPendingActivationSchedule("code-418", "label-117");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("PendingActivationSchedule rejects moves from expired", () => {
  const item = newPendingActivationSchedule("code-418", "label-117");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
