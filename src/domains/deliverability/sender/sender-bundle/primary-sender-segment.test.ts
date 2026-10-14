import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimarySenderSegment } from "./primary-sender-segment.js";

test("PrimarySenderSegment starts in open", () => {
  const item = newPrimarySenderSegment("code-667", "label-978");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimarySenderSegment moves to reopened", () => {
  const item = newPrimarySenderSegment("code-667", "label-978");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("PrimarySenderSegment rejects moves from archived", () => {
  const item = newPrimarySenderSegment("code-667", "label-978");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
