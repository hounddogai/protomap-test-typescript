import assert from "node:assert/strict";
import { test } from "node:test";
import { newConversionPolicy } from "./conversion-policy.js";

test("ConversionPolicy starts in requested", () => {
  const item = newConversionPolicy("code-368", "name-184");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ConversionPolicy moves to granted", () => {
  const item = newConversionPolicy("code-368", "name-184");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("ConversionPolicy rejects moves from expired", () => {
  const item = newConversionPolicy("code-368", "name-184");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
