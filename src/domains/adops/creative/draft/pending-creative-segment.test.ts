import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingCreativeSegment } from "./pending-creative-segment.js";

test("PendingCreativeSegment starts in open", () => {
  const item = newPendingCreativeSegment("code-639", "title-204");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingCreativeSegment moves to reopened", () => {
  const item = newPendingCreativeSegment("code-639", "title-204");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("PendingCreativeSegment rejects moves from archived", () => {
  const item = newPendingCreativeSegment("code-639", "title-204");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
