import assert from "node:assert/strict";
import { test } from "node:test";
import { newActivationDigest } from "./activation-digest.js";

test("ActivationDigest starts in open", () => {
  const item = newActivationDigest("code-157", "title-940");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ActivationDigest moves to resolved", () => {
  const item = newActivationDigest("code-157", "title-940");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("ActivationDigest rejects moves from archived", () => {
  const item = newActivationDigest("code-157", "title-940");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
