import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryNudgeOverride } from "./primary-nudge-override.js";

test("PrimaryNudgeOverride starts in created", () => {
  const item = newPrimaryNudgeOverride("code-22", "label-779");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryNudgeOverride moves to published", () => {
  const item = newPrimaryNudgeOverride("code-22", "label-779");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("PrimaryNudgeOverride rejects moves from retired", () => {
  const item = newPrimaryNudgeOverride("code-22", "label-779");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
