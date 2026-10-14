import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledSlaBaseline } from "./scheduled-sla-baseline.js";

test("ScheduledSlaBaseline starts in proposed", () => {
  const item = newScheduledSlaBaseline("code-817", "title-947");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledSlaBaseline moves to withdrawn", () => {
  const item = newScheduledSlaBaseline("code-817", "title-947");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("ScheduledSlaBaseline rejects moves from withdrawn", () => {
  const item = newScheduledSlaBaseline("code-817", "title-947");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
