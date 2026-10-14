import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualTouchpointSegment } from "./manual-touchpoint-segment.js";

test("ManualTouchpointSegment starts in draft", () => {
  const item = newManualTouchpointSegment("code-962", "title-544");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualTouchpointSegment moves to pending", () => {
  const item = newManualTouchpointSegment("code-962", "title-544");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("ManualTouchpointSegment rejects moves from closed", () => {
  const item = newManualTouchpointSegment("code-962", "title-544");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
