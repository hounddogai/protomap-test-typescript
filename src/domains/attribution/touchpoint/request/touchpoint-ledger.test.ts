import assert from "node:assert/strict";
import { test } from "node:test";
import { newTouchpointLedger } from "./touchpoint-ledger.js";

test("TouchpointLedger starts in requested", () => {
  const item = newTouchpointLedger("code-752", "title-876");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TouchpointLedger moves to granted", () => {
  const item = newTouchpointLedger("code-752", "title-876");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("TouchpointLedger rejects moves from expired", () => {
  const item = newTouchpointLedger("code-752", "title-876");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
