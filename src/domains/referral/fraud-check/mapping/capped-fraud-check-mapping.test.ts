import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedFraudCheckMapping } from "./capped-fraud-check-mapping.js";

test("CappedFraudCheckMapping starts in requested", () => {
  const item = newCappedFraudCheckMapping("code-398", "title-729");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedFraudCheckMapping moves to granted", () => {
  const item = newCappedFraudCheckMapping("code-398", "title-729");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("CappedFraudCheckMapping rejects moves from expired", () => {
  const item = newCappedFraudCheckMapping("code-398", "title-729");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
