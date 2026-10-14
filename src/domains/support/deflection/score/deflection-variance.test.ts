import assert from "node:assert/strict";
import { test } from "node:test";
import { newDeflectionVariance } from "./deflection-variance.js";

test("DeflectionVariance starts in new", () => {
  const item = newDeflectionVariance("code-194", "name-438");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DeflectionVariance moves to queued", () => {
  const item = newDeflectionVariance("code-194", "name-438");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("DeflectionVariance rejects moves from failed", () => {
  const item = newDeflectionVariance("code-194", "name-438");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
