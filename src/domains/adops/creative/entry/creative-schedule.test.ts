import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreativeSchedule } from "./creative-schedule.js";

test("CreativeSchedule starts in proposed", () => {
  const item = newCreativeSchedule("code-908", "title-88");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreativeSchedule moves to withdrawn", () => {
  const item = newCreativeSchedule("code-908", "title-88");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("CreativeSchedule rejects moves from withdrawn", () => {
  const item = newCreativeSchedule("code-908", "title-88");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
