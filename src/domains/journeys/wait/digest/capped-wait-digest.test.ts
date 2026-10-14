import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedWaitDigest } from "./capped-wait-digest.js";

test("CappedWaitDigest starts in created", () => {
  const item = newCappedWaitDigest("code-856", "title-824");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedWaitDigest moves to validated", () => {
  const item = newCappedWaitDigest("code-856", "title-824");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("CappedWaitDigest rejects moves from retired", () => {
  const item = newCappedWaitDigest("code-856", "title-824");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
