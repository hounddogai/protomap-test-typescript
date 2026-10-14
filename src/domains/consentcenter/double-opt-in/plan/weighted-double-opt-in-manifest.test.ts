import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedDoubleOptInManifest } from "./weighted-double-opt-in-manifest.js";

test("WeightedDoubleOptInManifest starts in proposed", () => {
  const item = newWeightedDoubleOptInManifest("code-386", "label-502");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedDoubleOptInManifest moves to approved", () => {
  const item = newWeightedDoubleOptInManifest("code-386", "label-502");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("WeightedDoubleOptInManifest rejects moves from withdrawn", () => {
  const item = newWeightedDoubleOptInManifest("code-386", "label-502");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
