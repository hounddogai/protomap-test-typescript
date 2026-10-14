import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredOptOutWindow } from "./tiered-opt-out-window.js";

test("TieredOptOutWindow starts in requested", () => {
  const item = newTieredOptOutWindow("code-903", "name-748");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredOptOutWindow moves to granted", () => {
  const item = newTieredOptOutWindow("code-903", "name-748");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("TieredOptOutWindow rejects moves from expired", () => {
  const item = newTieredOptOutWindow("code-903", "name-748");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
