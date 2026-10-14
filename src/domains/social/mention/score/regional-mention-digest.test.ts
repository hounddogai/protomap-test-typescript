import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalMentionDigest } from "./regional-mention-digest.js";

test("RegionalMentionDigest starts in requested", () => {
  const item = newRegionalMentionDigest("code-639", "title-204");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalMentionDigest moves to granted", () => {
  const item = newRegionalMentionDigest("code-639", "title-204");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("RegionalMentionDigest rejects moves from expired", () => {
  const item = newRegionalMentionDigest("code-639", "title-204");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
