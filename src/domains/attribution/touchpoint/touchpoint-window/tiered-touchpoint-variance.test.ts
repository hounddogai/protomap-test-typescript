import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredTouchpointVariance } from "./tiered-touchpoint-variance.js";

test("TieredTouchpointVariance starts in proposed", () => {
  const item = newTieredTouchpointVariance("code-17", "label-609");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredTouchpointVariance moves to approved", () => {
  const item = newTieredTouchpointVariance("code-17", "label-609");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("TieredTouchpointVariance rejects moves from withdrawn", () => {
  const item = newTieredTouchpointVariance("code-17", "label-609");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
