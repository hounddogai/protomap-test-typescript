import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualWaitDigest } from "./manual-wait-digest.js";

test("ManualWaitDigest starts in draft", () => {
  const item = newManualWaitDigest("code-812", "label-527");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualWaitDigest moves to closed", () => {
  const item = newManualWaitDigest("code-812", "label-527");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("ManualWaitDigest rejects moves from closed", () => {
  const item = newManualWaitDigest("code-812", "label-527");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
