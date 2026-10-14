import assert from "node:assert/strict";
import { test } from "node:test";
import { newDeflectionRequest } from "./deflection-request.js";

test("DeflectionRequest starts in proposed", () => {
  const item = newDeflectionRequest("code-636", "label-506");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DeflectionRequest moves to rejected", () => {
  const item = newDeflectionRequest("code-636", "label-506");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("DeflectionRequest rejects moves from withdrawn", () => {
  const item = newDeflectionRequest("code-636", "label-506");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
