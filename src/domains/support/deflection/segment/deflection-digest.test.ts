import assert from "node:assert/strict";
import { test } from "node:test";
import { newDeflectionDigest } from "./deflection-digest.js";

test("DeflectionDigest starts in new", () => {
  const item = newDeflectionDigest("code-648", "title-900");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DeflectionDigest moves to queued", () => {
  const item = newDeflectionDigest("code-648", "title-900");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("DeflectionDigest rejects moves from failed", () => {
  const item = newDeflectionDigest("code-648", "title-900");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
