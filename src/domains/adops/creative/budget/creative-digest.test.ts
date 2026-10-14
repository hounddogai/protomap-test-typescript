import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreativeDigest } from "./creative-digest.js";

test("CreativeDigest starts in open", () => {
  const item = newCreativeDigest("code-587", "label-337");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreativeDigest moves to resolved", () => {
  const item = newCreativeDigest("code-587", "label-337");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("CreativeDigest rejects moves from archived", () => {
  const item = newCreativeDigest("code-587", "label-337");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
