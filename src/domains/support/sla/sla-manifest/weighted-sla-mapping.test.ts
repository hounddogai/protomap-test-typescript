import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedSlaMapping } from "./weighted-sla-mapping.js";

test("WeightedSlaMapping starts in requested", () => {
  const item = newWeightedSlaMapping("code-731", "name-889");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedSlaMapping moves to expired", () => {
  const item = newWeightedSlaMapping("code-731", "name-889");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("WeightedSlaMapping rejects moves from expired", () => {
  const item = newWeightedSlaMapping("code-731", "name-889");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
