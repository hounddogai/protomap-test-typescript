import assert from "node:assert/strict";
import { test } from "node:test";
import { newCsatClaim } from "./csat-claim.js";

test("CsatClaim starts in new", () => {
  const item = newCsatClaim("code-117", "title-728");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CsatClaim moves to done", () => {
  const item = newCsatClaim("code-117", "title-728");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("CsatClaim rejects moves from failed", () => {
  const item = newCsatClaim("code-117", "title-728");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
