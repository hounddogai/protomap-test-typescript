import assert from "node:assert/strict";
import { test } from "node:test";
import { newInsightManifest } from "./insight-manifest.js";

test("InsightManifest starts in proposed", () => {
  const item = newInsightManifest("code-195", "name-524");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InsightManifest moves to approved", () => {
  const item = newInsightManifest("code-195", "name-524");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("InsightManifest rejects moves from withdrawn", () => {
  const item = newInsightManifest("code-195", "name-524");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
