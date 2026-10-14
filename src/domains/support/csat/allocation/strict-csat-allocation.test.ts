import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictCsatAllocation } from "./strict-csat-allocation.js";

test("StrictCsatAllocation starts in requested", () => {
  const item = newStrictCsatAllocation("code-685", "label-106");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictCsatAllocation moves to revoked", () => {
  const item = newStrictCsatAllocation("code-685", "label-106");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("StrictCsatAllocation rejects moves from expired", () => {
  const item = newStrictCsatAllocation("code-685", "label-106");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
