import assert from "node:assert/strict";
import { test } from "node:test";
import { newPreferenceSegment } from "./preference-segment.js";

test("PreferenceSegment starts in proposed", () => {
  const item = newPreferenceSegment("code-230", "name-298");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PreferenceSegment moves to rejected", () => {
  const item = newPreferenceSegment("code-230", "name-298");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("PreferenceSegment rejects moves from withdrawn", () => {
  const item = newPreferenceSegment("code-230", "name-298");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
