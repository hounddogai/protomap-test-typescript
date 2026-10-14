import assert from "node:assert/strict";
import { test } from "node:test";
import { newStreakAgreement } from "./streak-agreement.js";

test("StreakAgreement starts in open", () => {
  const item = newStreakAgreement("code-521", "name-459");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StreakAgreement moves to archived", () => {
  const item = newStreakAgreement("code-521", "name-459");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("StreakAgreement rejects moves from archived", () => {
  const item = newStreakAgreement("code-521", "name-459");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
