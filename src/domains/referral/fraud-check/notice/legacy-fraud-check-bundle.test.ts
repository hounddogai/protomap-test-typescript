import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyFraudCheckBundle } from "./legacy-fraud-check-bundle.js";

test("LegacyFraudCheckBundle starts in draft", () => {
  const item = newLegacyFraudCheckBundle("code-68", "title-604");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyFraudCheckBundle moves to closed", () => {
  const item = newLegacyFraudCheckBundle("code-68", "title-604");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("LegacyFraudCheckBundle rejects moves from closed", () => {
  const item = newLegacyFraudCheckBundle("code-68", "title-604");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
