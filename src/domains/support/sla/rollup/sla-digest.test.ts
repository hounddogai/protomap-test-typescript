import assert from "node:assert/strict";
import { test } from "node:test";
import { newSlaDigest } from "./sla-digest.js";

test("SlaDigest starts in open", () => {
  const item = newSlaDigest("code-903", "label-555");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SlaDigest moves to reopened", () => {
  const item = newSlaDigest("code-903", "label-555");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("SlaDigest rejects moves from archived", () => {
  const item = newSlaDigest("code-903", "label-555");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
