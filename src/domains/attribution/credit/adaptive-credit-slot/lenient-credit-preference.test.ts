import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientCreditPreference } from "./lenient-credit-preference.js";

test("LenientCreditPreference starts in new", () => {
  const item = newLenientCreditPreference("code-968", "title-759");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientCreditPreference moves to queued", () => {
  const item = newLenientCreditPreference("code-968", "title-759");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("LenientCreditPreference rejects moves from failed", () => {
  const item = newLenientCreditPreference("code-968", "title-759");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
