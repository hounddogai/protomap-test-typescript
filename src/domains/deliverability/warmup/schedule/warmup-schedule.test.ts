import assert from "node:assert/strict";
import { test } from "node:test";
import { newWarmupSchedule } from "./warmup-schedule.js";

test("WarmupSchedule starts in created", () => {
  const item = newWarmupSchedule("code-862", "title-542");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WarmupSchedule moves to published", () => {
  const item = newWarmupSchedule("code-862", "title-542");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("WarmupSchedule rejects moves from retired", () => {
  const item = newWarmupSchedule("code-862", "title-542");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
