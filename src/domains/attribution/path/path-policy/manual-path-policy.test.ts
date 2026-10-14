import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualPathPolicy } from "./manual-path-policy.js";

test("ManualPathPolicy starts in requested", () => {
  const item = newManualPathPolicy("code-931", "label-633");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualPathPolicy moves to granted", () => {
  const item = newManualPathPolicy("code-931", "label-633");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("ManualPathPolicy rejects moves from expired", () => {
  const item = newManualPathPolicy("code-931", "label-633");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
