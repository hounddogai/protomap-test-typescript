import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientStreakAgreement } from "./lenient-streak-agreement.js";

test("LenientStreakAgreement starts in new", () => {
  const item = newLenientStreakAgreement("code-107", "label-968");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientStreakAgreement moves to done", () => {
  const item = newLenientStreakAgreement("code-107", "label-968");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("LenientStreakAgreement rejects moves from failed", () => {
  const item = newLenientStreakAgreement("code-107", "label-968");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
