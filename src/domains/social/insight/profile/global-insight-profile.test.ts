import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalInsightProfile } from "./global-insight-profile.js";

test("GlobalInsightProfile starts in planned", () => {
  const item = newGlobalInsightProfile("code-32", "name-649");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalInsightProfile moves to scheduled", () => {
  const item = newGlobalInsightProfile("code-32", "name-649");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("GlobalInsightProfile rejects moves from cancelled", () => {
  const item = newGlobalInsightProfile("code-32", "name-649");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
