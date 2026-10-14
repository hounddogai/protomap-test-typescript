import assert from "node:assert/strict";
import { test } from "node:test";
import { newFraudCheckManifest } from "./fraud-check-manifest.js";

test("FraudCheckManifest starts in new", () => {
  const item = newFraudCheckManifest("code-610", "label-776");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FraudCheckManifest moves to queued", () => {
  const item = newFraudCheckManifest("code-610", "label-776");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("FraudCheckManifest rejects moves from failed", () => {
  const item = newFraudCheckManifest("code-610", "label-776");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
