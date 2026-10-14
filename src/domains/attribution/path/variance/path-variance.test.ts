import assert from "node:assert/strict";
import { test } from "node:test";
import { newPathVariance } from "./path-variance.js";

test("PathVariance starts in requested", () => {
  const item = newPathVariance("code-558", "name-134");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PathVariance moves to granted", () => {
  const item = newPathVariance("code-558", "name-134");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("PathVariance rejects moves from expired", () => {
  const item = newPathVariance("code-558", "name-134");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
