import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientWarmupEntry } from "./lenient-warmup-entry.js";

test("LenientWarmupEntry starts in open", () => {
  const item = newLenientWarmupEntry("code-464", "title-337");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientWarmupEntry moves to in review", () => {
  const item = newLenientWarmupEntry("code-464", "title-337");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("LenientWarmupEntry rejects moves from archived", () => {
  const item = newLenientWarmupEntry("code-464", "title-337");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
