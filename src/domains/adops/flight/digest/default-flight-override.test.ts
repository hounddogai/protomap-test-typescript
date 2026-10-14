import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultFlightOverride } from "./default-flight-override.js";

test("DefaultFlightOverride starts in requested", () => {
  const item = newDefaultFlightOverride("code-751", "name-876");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultFlightOverride moves to revoked", () => {
  const item = newDefaultFlightOverride("code-751", "name-876");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("DefaultFlightOverride rejects moves from expired", () => {
  const item = newDefaultFlightOverride("code-751", "name-876");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
