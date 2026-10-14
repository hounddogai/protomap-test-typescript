import assert from "node:assert/strict";
import { test } from "node:test";
import { newModelClaim } from "./model-claim.js";

test("ModelClaim starts in draft", () => {
  const item = newModelClaim("code-947", "name-105");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ModelClaim moves to suspended", () => {
  const item = newModelClaim("code-947", "name-105");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("ModelClaim rejects moves from closed", () => {
  const item = newModelClaim("code-947", "name-105");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
