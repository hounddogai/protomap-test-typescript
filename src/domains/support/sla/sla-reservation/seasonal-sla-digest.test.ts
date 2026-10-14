import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalSlaDigest } from "./seasonal-sla-digest.js";

test("SeasonalSlaDigest starts in new", () => {
  const item = newSeasonalSlaDigest("code-268", "name-525");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalSlaDigest moves to done", () => {
  const item = newSeasonalSlaDigest("code-268", "name-525");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("SeasonalSlaDigest rejects moves from failed", () => {
  const item = newSeasonalSlaDigest("code-268", "name-525");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
