import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientActivationSchedule } from "./lenient-activation-schedule.js";

test("LenientActivationSchedule starts in proposed", () => {
  const item = newLenientActivationSchedule("code-928", "title-993");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientActivationSchedule moves to withdrawn", () => {
  const item = newLenientActivationSchedule("code-928", "title-993");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("LenientActivationSchedule rejects moves from withdrawn", () => {
  const item = newLenientActivationSchedule("code-928", "title-993");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
