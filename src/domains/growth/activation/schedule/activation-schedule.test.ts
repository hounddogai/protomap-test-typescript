import assert from "node:assert/strict";
import { test } from "node:test";
import { newActivationSchedule } from "./activation-schedule.js";

test("ActivationSchedule starts in proposed", () => {
  const item = newActivationSchedule("code-884", "label-712");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ActivationSchedule moves to approved", () => {
  const item = newActivationSchedule("code-884", "label-712");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("ActivationSchedule rejects moves from withdrawn", () => {
  const item = newActivationSchedule("code-884", "label-712");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
