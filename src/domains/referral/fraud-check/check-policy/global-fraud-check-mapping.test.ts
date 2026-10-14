import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalFraudCheckMapping } from "./global-fraud-check-mapping.js";

test("GlobalFraudCheckMapping starts in proposed", () => {
  const item = newGlobalFraudCheckMapping("code-472", "label-548");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalFraudCheckMapping moves to approved", () => {
  const item = newGlobalFraudCheckMapping("code-472", "label-548");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("GlobalFraudCheckMapping rejects moves from withdrawn", () => {
  const item = newGlobalFraudCheckMapping("code-472", "label-548");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
