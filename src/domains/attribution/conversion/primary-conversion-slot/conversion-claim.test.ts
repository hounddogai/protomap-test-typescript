import assert from "node:assert/strict";
import { test } from "node:test";
import { newConversionClaim } from "./conversion-claim.js";

test("ConversionClaim starts in new", () => {
  const item = newConversionClaim("code-558", "title-909");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ConversionClaim moves to done", () => {
  const item = newConversionClaim("code-558", "title-909");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("ConversionClaim rejects moves from failed", () => {
  const item = newConversionClaim("code-558", "title-909");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
