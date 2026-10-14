import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalSenderMilestone } from "./seasonal-sender-milestone.js";

test("SeasonalSenderMilestone starts in proposed", () => {
  const item = newSeasonalSenderMilestone("code-481", "label-228");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalSenderMilestone moves to approved", () => {
  const item = newSeasonalSenderMilestone("code-481", "label-228");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("SeasonalSenderMilestone rejects moves from withdrawn", () => {
  const item = newSeasonalSenderMilestone("code-481", "label-228");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
