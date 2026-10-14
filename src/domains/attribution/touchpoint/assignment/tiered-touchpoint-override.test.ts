import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredTouchpointOverride } from "./tiered-touchpoint-override.js";

test("TieredTouchpointOverride starts in created", () => {
  const item = newTieredTouchpointOverride("code-215", "label-460");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredTouchpointOverride moves to published", () => {
  const item = newTieredTouchpointOverride("code-215", "label-460");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("TieredTouchpointOverride rejects moves from retired", () => {
  const item = newTieredTouchpointOverride("code-215", "label-460");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
