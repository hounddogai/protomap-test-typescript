import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientReplyEntry } from "./lenient-reply-entry.js";

test("LenientReplyEntry starts in planned", () => {
  const item = newLenientReplyEntry("code-6", "name-810");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientReplyEntry moves to scheduled", () => {
  const item = newLenientReplyEntry("code-6", "name-810");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("LenientReplyEntry rejects moves from cancelled", () => {
  const item = newLenientReplyEntry("code-6", "name-810");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
