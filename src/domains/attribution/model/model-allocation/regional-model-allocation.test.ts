import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalModelAllocation } from "./regional-model-allocation.js";

test("RegionalModelAllocation starts in requested", () => {
  const item = newRegionalModelAllocation("code-81", "label-395");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalModelAllocation moves to granted", () => {
  const item = newRegionalModelAllocation("code-81", "label-395");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("RegionalModelAllocation rejects moves from expired", () => {
  const item = newRegionalModelAllocation("code-81", "label-395");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
