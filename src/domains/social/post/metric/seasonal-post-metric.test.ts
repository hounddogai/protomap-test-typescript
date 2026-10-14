import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalPostMetric } from "./seasonal-post-metric.js";

test("SeasonalPostMetric starts in requested", () => {
  const item = newSeasonalPostMetric("code-923", "label-473");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalPostMetric moves to granted", () => {
  const item = newSeasonalPostMetric("code-923", "label-473");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("SeasonalPostMetric rejects moves from expired", () => {
  const item = newSeasonalPostMetric("code-923", "label-473");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
