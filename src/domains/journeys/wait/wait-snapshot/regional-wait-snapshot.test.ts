import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalWaitSnapshot } from "./regional-wait-snapshot.js";

test("RegionalWaitSnapshot starts in requested", () => {
  const item = newRegionalWaitSnapshot("code-698", "title-668");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalWaitSnapshot moves to revoked", () => {
  const item = newRegionalWaitSnapshot("code-698", "title-668");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("RegionalWaitSnapshot rejects moves from expired", () => {
  const item = newRegionalWaitSnapshot("code-698", "title-668");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
