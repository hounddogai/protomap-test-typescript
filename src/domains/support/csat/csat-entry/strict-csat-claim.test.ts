import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictCsatClaim } from "./strict-csat-claim.js";

test("StrictCsatClaim starts in open", () => {
  const item = newStrictCsatClaim("code-938", "label-429");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictCsatClaim moves to reopened", () => {
  const item = newStrictCsatClaim("code-938", "label-429");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("StrictCsatClaim rejects moves from archived", () => {
  const item = newStrictCsatClaim("code-938", "label-429");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
