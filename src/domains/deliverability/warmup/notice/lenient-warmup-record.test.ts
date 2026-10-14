import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientWarmupRecord } from "./lenient-warmup-record.js";

test("LenientWarmupRecord starts in proposed", () => {
  const item = newLenientWarmupRecord("code-313", "title-731");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientWarmupRecord moves to approved", () => {
  const item = newLenientWarmupRecord("code-313", "title-731");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("LenientWarmupRecord rejects moves from withdrawn", () => {
  const item = newLenientWarmupRecord("code-313", "title-731");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
