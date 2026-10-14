import assert from "node:assert/strict";
import { test } from "node:test";
import { newConversionTemplate } from "./conversion-template.js";

test("ConversionTemplate starts in requested", () => {
  const item = newConversionTemplate("code-324", "name-463");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ConversionTemplate moves to revoked", () => {
  const item = newConversionTemplate("code-324", "name-463");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("ConversionTemplate rejects moves from expired", () => {
  const item = newConversionTemplate("code-324", "name-463");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
