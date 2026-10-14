import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalReplyDigest } from "./regional-reply-digest.js";

test("RegionalReplyDigest starts in proposed", () => {
  const item = newRegionalReplyDigest("code-757", "name-151");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalReplyDigest moves to approved", () => {
  const item = newRegionalReplyDigest("code-757", "name-151");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("RegionalReplyDigest rejects moves from withdrawn", () => {
  const item = newRegionalReplyDigest("code-757", "name-151");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
