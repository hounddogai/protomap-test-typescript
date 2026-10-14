import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalSlaDigest } from "./regional-sla-digest.js";

test("RegionalSlaDigest starts in open", () => {
  const item = newRegionalSlaDigest("code-50", "name-996");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalSlaDigest moves to in review", () => {
  const item = newRegionalSlaDigest("code-50", "name-996");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("RegionalSlaDigest rejects moves from archived", () => {
  const item = newRegionalSlaDigest("code-50", "name-996");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
