import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreativeSegment } from "./creative-segment.js";

test("CreativeSegment starts in planned", () => {
  const item = newCreativeSegment("code-889", "title-538");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreativeSegment moves to in progress", () => {
  const item = newCreativeSegment("code-889", "title-538");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("CreativeSegment rejects moves from cancelled", () => {
  const item = newCreativeSegment("code-889", "title-538");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
