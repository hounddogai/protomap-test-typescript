import assert from "node:assert/strict";
import { test } from "node:test";
import { newFlightDigest } from "./flight-digest.js";

test("FlightDigest starts in created", () => {
  const item = newFlightDigest("code-762", "name-750");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FlightDigest moves to validated", () => {
  const item = newFlightDigest("code-762", "name-750");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("FlightDigest rejects moves from retired", () => {
  const item = newFlightDigest("code-762", "name-750");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
