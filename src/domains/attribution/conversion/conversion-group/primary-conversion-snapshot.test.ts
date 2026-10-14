import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryConversionSnapshot } from "./primary-conversion-snapshot.js";

test("PrimaryConversionSnapshot starts in planned", () => {
  const item = newPrimaryConversionSnapshot("code-930", "label-304");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryConversionSnapshot moves to scheduled", () => {
  const item = newPrimaryConversionSnapshot("code-930", "label-304");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("PrimaryConversionSnapshot rejects moves from cancelled", () => {
  const item = newPrimaryConversionSnapshot("code-930", "label-304");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
