import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultPreferenceSegment } from "./default-preference-segment.js";

test("DefaultPreferenceSegment starts in draft", () => {
  const item = newDefaultPreferenceSegment("code-606", "name-972");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultPreferenceSegment moves to closed", () => {
  const item = newDefaultPreferenceSegment("code-606", "name-972");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("DefaultPreferenceSegment rejects moves from closed", () => {
  const item = newDefaultPreferenceSegment("code-606", "name-972");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
