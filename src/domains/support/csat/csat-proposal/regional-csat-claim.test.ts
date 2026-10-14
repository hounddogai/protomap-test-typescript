import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalCsatClaim } from "./regional-csat-claim.js";

test("RegionalCsatClaim starts in draft", () => {
  const item = newRegionalCsatClaim("code-170", "name-675");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalCsatClaim moves to closed", () => {
  const item = newRegionalCsatClaim("code-170", "name-675");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("RegionalCsatClaim rejects moves from closed", () => {
  const item = newRegionalCsatClaim("code-170", "name-675");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
