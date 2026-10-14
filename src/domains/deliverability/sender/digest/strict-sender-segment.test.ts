import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictSenderSegment } from "./strict-sender-segment.js";

test("StrictSenderSegment starts in planned", () => {
  const item = newStrictSenderSegment("code-409", "title-912");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictSenderSegment moves to scheduled", () => {
  const item = newStrictSenderSegment("code-409", "title-912");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("StrictSenderSegment rejects moves from cancelled", () => {
  const item = newStrictSenderSegment("code-409", "title-912");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
