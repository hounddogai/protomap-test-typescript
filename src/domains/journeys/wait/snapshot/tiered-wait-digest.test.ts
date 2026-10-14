import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredWaitDigest } from "./tiered-wait-digest.js";

test("TieredWaitDigest starts in created", () => {
  const item = newTieredWaitDigest("code-129", "name-620");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredWaitDigest moves to validated", () => {
  const item = newTieredWaitDigest("code-129", "name-620");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("TieredWaitDigest rejects moves from retired", () => {
  const item = newTieredWaitDigest("code-129", "name-620");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
