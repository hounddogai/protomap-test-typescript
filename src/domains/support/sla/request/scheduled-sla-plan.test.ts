import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledSlaPlan } from "./scheduled-sla-plan.js";

test("ScheduledSlaPlan starts in created", () => {
  const item = newScheduledSlaPlan("code-936", "name-904");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledSlaPlan moves to retired", () => {
  const item = newScheduledSlaPlan("code-936", "name-904");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("ScheduledSlaPlan rejects moves from retired", () => {
  const item = newScheduledSlaPlan("code-936", "name-904");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
