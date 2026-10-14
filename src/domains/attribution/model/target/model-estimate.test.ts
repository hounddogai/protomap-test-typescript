import assert from "node:assert/strict";
import { test } from "node:test";
import { newModelEstimate } from "./model-estimate.js";

test("ModelEstimate starts in created", () => {
  const item = newModelEstimate("code-648", "title-91");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ModelEstimate moves to validated", () => {
  const item = newModelEstimate("code-648", "title-91");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("ModelEstimate rejects moves from retired", () => {
  const item = newModelEstimate("code-648", "title-91");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
