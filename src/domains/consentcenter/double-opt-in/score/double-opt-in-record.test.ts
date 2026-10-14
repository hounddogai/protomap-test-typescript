import assert from "node:assert/strict";
import { test } from "node:test";
import { newDoubleOptInRecord } from "./double-opt-in-record.js";

test("DoubleOptInRecord starts in planned", () => {
  const item = newDoubleOptInRecord("code-502", "label-466");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DoubleOptInRecord moves to cancelled", () => {
  const item = newDoubleOptInRecord("code-502", "label-466");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("DoubleOptInRecord rejects moves from cancelled", () => {
  const item = newDoubleOptInRecord("code-502", "label-466");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
