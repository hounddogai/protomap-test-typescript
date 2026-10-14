import assert from "node:assert/strict";
import { test } from "node:test";
import { newConversionThreshold } from "./conversion-threshold.js";

test("ConversionThreshold starts in requested", () => {
  const item = newConversionThreshold("code-306", "title-868");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ConversionThreshold moves to revoked", () => {
  const item = newConversionThreshold("code-306", "title-868");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("ConversionThreshold rejects moves from expired", () => {
  const item = newConversionThreshold("code-306", "title-868");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
