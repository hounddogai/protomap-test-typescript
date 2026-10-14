import assert from "node:assert/strict";
import { test } from "node:test";
import { newWaitManifest } from "./wait-manifest.js";

test("WaitManifest starts in created", () => {
  const item = newWaitManifest("code-388", "title-699");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WaitManifest moves to validated", () => {
  const item = newWaitManifest("code-388", "title-699");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("WaitManifest rejects moves from retired", () => {
  const item = newWaitManifest("code-388", "title-699");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
