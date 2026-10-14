import assert from "node:assert/strict";
import { test } from "node:test";
import { newDoubleOptInManifest } from "./double-opt-in-manifest.js";

test("DoubleOptInManifest starts in draft", () => {
  const item = newDoubleOptInManifest("code-847", "name-885");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DoubleOptInManifest moves to pending", () => {
  const item = newDoubleOptInManifest("code-847", "name-885");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("DoubleOptInManifest rejects moves from closed", () => {
  const item = newDoubleOptInManifest("code-847", "name-885");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
