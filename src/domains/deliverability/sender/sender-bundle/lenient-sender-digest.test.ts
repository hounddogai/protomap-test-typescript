import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientSenderDigest } from "./lenient-sender-digest.js";

test("LenientSenderDigest starts in created", () => {
  const item = newLenientSenderDigest("code-311", "name-527");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientSenderDigest moves to published", () => {
  const item = newLenientSenderDigest("code-311", "name-527");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("LenientSenderDigest rejects moves from retired", () => {
  const item = newLenientSenderDigest("code-311", "name-527");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
