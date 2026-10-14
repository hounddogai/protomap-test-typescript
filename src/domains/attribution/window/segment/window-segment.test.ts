import assert from "node:assert/strict";
import { test } from "node:test";
import { newWindowSegment } from "./window-segment.js";

test("WindowSegment starts in planned", () => {
  const item = newWindowSegment("code-983", "name-245");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WindowSegment moves to scheduled", () => {
  const item = newWindowSegment("code-983", "name-245");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("WindowSegment rejects moves from cancelled", () => {
  const item = newWindowSegment("code-983", "name-245");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
