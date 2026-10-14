import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredBounceRequest } from "./tiered-bounce-request.js";

test("TieredBounceRequest starts in open", () => {
  const item = newTieredBounceRequest("code-151", "title-828");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredBounceRequest moves to in review", () => {
  const item = newTieredBounceRequest("code-151", "title-828");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("TieredBounceRequest rejects moves from archived", () => {
  const item = newTieredBounceRequest("code-151", "title-828");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
