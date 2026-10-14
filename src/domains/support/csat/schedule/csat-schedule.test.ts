import assert from "node:assert/strict";
import { test } from "node:test";
import { newCsatSchedule } from "./csat-schedule.js";

test("CsatSchedule starts in draft", () => {
  const item = newCsatSchedule("code-563", "label-942");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CsatSchedule moves to pending", () => {
  const item = newCsatSchedule("code-563", "label-942");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("CsatSchedule rejects moves from closed", () => {
  const item = newCsatSchedule("code-563", "label-942");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
