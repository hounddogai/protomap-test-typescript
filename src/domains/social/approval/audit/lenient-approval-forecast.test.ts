import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientApprovalForecast } from "./lenient-approval-forecast.js";

test("LenientApprovalForecast starts in draft", () => {
  const item = newLenientApprovalForecast("code-239", "name-510");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientApprovalForecast moves to suspended", () => {
  const item = newLenientApprovalForecast("code-239", "name-510");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("LenientApprovalForecast rejects moves from closed", () => {
  const item = newLenientApprovalForecast("code-239", "name-510");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
