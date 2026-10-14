import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryCreativeDigest } from "./primary-creative-digest.js";

test("PrimaryCreativeDigest starts in proposed", () => {
  const item = newPrimaryCreativeDigest("code-816", "name-502");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryCreativeDigest moves to rejected", () => {
  const item = newPrimaryCreativeDigest("code-816", "name-502");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("PrimaryCreativeDigest rejects moves from withdrawn", () => {
  const item = newPrimaryCreativeDigest("code-816", "name-502");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
