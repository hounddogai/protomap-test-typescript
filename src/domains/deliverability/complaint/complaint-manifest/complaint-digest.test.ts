import assert from "node:assert/strict";
import { test } from "node:test";
import { newComplaintDigest } from "./complaint-digest.js";

test("ComplaintDigest starts in requested", () => {
  const item = newComplaintDigest("code-615", "title-101");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ComplaintDigest moves to granted", () => {
  const item = newComplaintDigest("code-615", "title-101");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("ComplaintDigest rejects moves from expired", () => {
  const item = newComplaintDigest("code-615", "title-101");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
