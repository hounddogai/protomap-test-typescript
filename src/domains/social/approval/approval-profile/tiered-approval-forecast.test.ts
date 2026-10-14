import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredApprovalForecast } from "./tiered-approval-forecast.js";

test("TieredApprovalForecast starts in requested", () => {
  const item = newTieredApprovalForecast("code-906", "label-430");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredApprovalForecast moves to granted", () => {
  const item = newTieredApprovalForecast("code-906", "label-430");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("TieredApprovalForecast rejects moves from expired", () => {
  const item = newTieredApprovalForecast("code-906", "label-430");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
