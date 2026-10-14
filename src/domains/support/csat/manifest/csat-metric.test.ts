import assert from "node:assert/strict";
import { test } from "node:test";
import { newCsatMetric } from "./csat-metric.js";

test("CsatMetric starts in requested", () => {
  const item = newCsatMetric("code-674", "name-853");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CsatMetric moves to revoked", () => {
  const item = newCsatMetric("code-674", "name-853");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("CsatMetric rejects moves from expired", () => {
  const item = newCsatMetric("code-674", "name-853");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
