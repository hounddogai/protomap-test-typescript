import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredWaitManifest } from "./tiered-wait-manifest.js";

test("TieredWaitManifest starts in proposed", () => {
  const item = newTieredWaitManifest("code-447", "label-394");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredWaitManifest moves to approved", () => {
  const item = newTieredWaitManifest("code-447", "label-394");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("TieredWaitManifest rejects moves from withdrawn", () => {
  const item = newTieredWaitManifest("code-447", "label-394");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
