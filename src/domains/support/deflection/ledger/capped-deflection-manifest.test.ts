import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedDeflectionManifest } from "./capped-deflection-manifest.js";

test("CappedDeflectionManifest starts in open", () => {
  const item = newCappedDeflectionManifest("code-736", "title-917");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedDeflectionManifest moves to resolved", () => {
  const item = newCappedDeflectionManifest("code-736", "title-917");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("CappedDeflectionManifest rejects moves from archived", () => {
  const item = newCappedDeflectionManifest("code-736", "title-917");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
