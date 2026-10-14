import assert from "node:assert/strict";
import { test } from "node:test";
import { newModelSegment } from "./model-segment.js";

test("ModelSegment starts in created", () => {
  const item = newModelSegment("code-517", "title-401");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ModelSegment moves to published", () => {
  const item = newModelSegment("code-517", "title-401");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("ModelSegment rejects moves from retired", () => {
  const item = newModelSegment("code-517", "title-401");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
