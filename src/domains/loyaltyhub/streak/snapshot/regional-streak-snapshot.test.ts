import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalStreakSnapshot } from "./regional-streak-snapshot.js";

test("RegionalStreakSnapshot starts in planned", () => {
  const item = newRegionalStreakSnapshot("code-912", "title-183");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalStreakSnapshot moves to scheduled", () => {
  const item = newRegionalStreakSnapshot("code-912", "title-183");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("RegionalStreakSnapshot rejects moves from cancelled", () => {
  const item = newRegionalStreakSnapshot("code-912", "title-183");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
