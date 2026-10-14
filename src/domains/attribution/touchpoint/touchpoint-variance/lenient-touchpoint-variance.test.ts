import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientTouchpointVariance } from "./lenient-touchpoint-variance.js";

test("LenientTouchpointVariance starts in draft", () => {
  const item = newLenientTouchpointVariance("code-797", "name-264");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientTouchpointVariance moves to pending", () => {
  const item = newLenientTouchpointVariance("code-797", "name-264");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("LenientTouchpointVariance rejects moves from closed", () => {
  const item = newLenientTouchpointVariance("code-797", "name-264");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
