import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictProofSchedule } from "./strict-proof-schedule.js";

test("StrictProofSchedule starts in new", () => {
  const item = newStrictProofSchedule("code-404", "label-459");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictProofSchedule moves to done", () => {
  const item = newStrictProofSchedule("code-404", "label-459");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("StrictProofSchedule rejects moves from failed", () => {
  const item = newStrictProofSchedule("code-404", "label-459");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
