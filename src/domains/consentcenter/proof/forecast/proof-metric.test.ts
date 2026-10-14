import assert from "node:assert/strict";
import { test } from "node:test";
import { newProofMetric } from "./proof-metric.js";

test("ProofMetric starts in requested", () => {
  const item = newProofMetric("code-409", "label-468");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ProofMetric moves to granted", () => {
  const item = newProofMetric("code-409", "label-468");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("ProofMetric rejects moves from expired", () => {
  const item = newProofMetric("code-409", "label-468");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
