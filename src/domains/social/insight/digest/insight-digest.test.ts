import assert from "node:assert/strict";
import { test } from "node:test";
import { newInsightDigest } from "./insight-digest.js";

test("InsightDigest starts in proposed", () => {
  const item = newInsightDigest("code-460", "name-219");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InsightDigest moves to rejected", () => {
  const item = newInsightDigest("code-460", "name-219");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("InsightDigest rejects moves from withdrawn", () => {
  const item = newInsightDigest("code-460", "name-219");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
