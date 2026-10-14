import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingConversionTarget } from "./pending-conversion-target.js";

test("PendingConversionTarget starts in planned", () => {
  const item = newPendingConversionTarget("code-611", "title-575");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingConversionTarget moves to completed", () => {
  const item = newPendingConversionTarget("code-611", "title-575");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("PendingConversionTarget rejects moves from cancelled", () => {
  const item = newPendingConversionTarget("code-611", "title-575");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
