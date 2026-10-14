import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientStreakLedger } from "./lenient-streak-ledger.js";

test("LenientStreakLedger starts in planned", () => {
  const item = newLenientStreakLedger("code-55", "title-275");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientStreakLedger moves to scheduled", () => {
  const item = newLenientStreakLedger("code-55", "title-275");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("LenientStreakLedger rejects moves from cancelled", () => {
  const item = newLenientStreakLedger("code-55", "title-275");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
