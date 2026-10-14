import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientDeflectionRequest } from "./lenient-deflection-request.js";

test("LenientDeflectionRequest starts in requested", () => {
  const item = newLenientDeflectionRequest("code-422", "label-298");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientDeflectionRequest moves to granted", () => {
  const item = newLenientDeflectionRequest("code-422", "label-298");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("LenientDeflectionRequest rejects moves from expired", () => {
  const item = newLenientDeflectionRequest("code-422", "label-298");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
