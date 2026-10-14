import assert from "node:assert/strict";
import { test } from "node:test";
import { newInviteManifest } from "./invite-manifest.js";

test("InviteManifest starts in draft", () => {
  const item = newInviteManifest("code-148", "name-878");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InviteManifest moves to suspended", () => {
  const item = newInviteManifest("code-148", "name-878");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("InviteManifest rejects moves from closed", () => {
  const item = newInviteManifest("code-148", "name-878");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
