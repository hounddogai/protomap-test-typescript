import assert from "node:assert/strict";
import { test } from "node:test";
import { newDoubleOptInSegment } from "./double-opt-in-segment.js";

test("DoubleOptInSegment starts in open", () => {
  const item = newDoubleOptInSegment("code-792", "name-537");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DoubleOptInSegment moves to reopened", () => {
  const item = newDoubleOptInSegment("code-792", "name-537");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("DoubleOptInSegment rejects moves from archived", () => {
  const item = newDoubleOptInSegment("code-792", "name-537");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
