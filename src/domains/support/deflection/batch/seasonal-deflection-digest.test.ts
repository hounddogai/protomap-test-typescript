import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalDeflectionDigest } from "./seasonal-deflection-digest.js";

test("SeasonalDeflectionDigest starts in draft", () => {
  const item = newSeasonalDeflectionDigest("code-768", "label-761");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalDeflectionDigest moves to pending", () => {
  const item = newSeasonalDeflectionDigest("code-768", "label-761");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("SeasonalDeflectionDigest rejects moves from closed", () => {
  const item = newSeasonalDeflectionDigest("code-768", "label-761");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
