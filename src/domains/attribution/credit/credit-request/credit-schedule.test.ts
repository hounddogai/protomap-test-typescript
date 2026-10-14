import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreditSchedule } from "./credit-schedule.js";

test("CreditSchedule starts in proposed", () => {
  const item = newCreditSchedule("code-79", "title-973");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreditSchedule moves to approved", () => {
  const item = newCreditSchedule("code-79", "title-973");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("CreditSchedule rejects moves from withdrawn", () => {
  const item = newCreditSchedule("code-79", "title-973");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
