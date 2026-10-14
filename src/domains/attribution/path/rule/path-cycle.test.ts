import assert from "node:assert/strict";
import { test } from "node:test";
import { newPathCycle } from "./path-cycle.js";

test("PathCycle starts in planned", () => {
  const item = newPathCycle("code-285", "name-331");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PathCycle moves to in progress", () => {
  const item = newPathCycle("code-285", "name-331");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("PathCycle rejects moves from cancelled", () => {
  const item = newPathCycle("code-285", "name-331");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
