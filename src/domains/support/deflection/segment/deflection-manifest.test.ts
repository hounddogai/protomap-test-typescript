import assert from "node:assert/strict";
import { test } from "node:test";
import { newDeflectionManifest } from "./deflection-manifest.js";

test("DeflectionManifest starts in new", () => {
  const item = newDeflectionManifest("code-907", "name-43");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DeflectionManifest moves to done", () => {
  const item = newDeflectionManifest("code-907", "name-43");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("DeflectionManifest rejects moves from failed", () => {
  const item = newDeflectionManifest("code-907", "name-43");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
