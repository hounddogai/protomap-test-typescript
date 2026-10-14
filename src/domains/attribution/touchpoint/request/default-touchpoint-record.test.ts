import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultTouchpointRecord } from "./default-touchpoint-record.js";

test("DefaultTouchpointRecord starts in proposed", () => {
  const item = newDefaultTouchpointRecord("code-590", "title-921");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultTouchpointRecord moves to withdrawn", () => {
  const item = newDefaultTouchpointRecord("code-590", "title-921");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("DefaultTouchpointRecord rejects moves from withdrawn", () => {
  const item = newDefaultTouchpointRecord("code-590", "title-921");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
