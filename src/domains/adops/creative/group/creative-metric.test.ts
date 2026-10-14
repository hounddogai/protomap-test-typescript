import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreativeMetric } from "./creative-metric.js";

test("CreativeMetric starts in planned", () => {
  const item = newCreativeMetric("code-911", "name-551");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreativeMetric moves to scheduled", () => {
  const item = newCreativeMetric("code-911", "name-551");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("CreativeMetric rejects moves from cancelled", () => {
  const item = newCreativeMetric("code-911", "name-551");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
