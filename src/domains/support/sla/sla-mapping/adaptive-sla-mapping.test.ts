import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveSlaMapping } from "./adaptive-sla-mapping.js";

test("AdaptiveSlaMapping starts in created", () => {
  const item = newAdaptiveSlaMapping("code-751", "title-104");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveSlaMapping moves to validated", () => {
  const item = newAdaptiveSlaMapping("code-751", "title-104");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("AdaptiveSlaMapping rejects moves from retired", () => {
  const item = newAdaptiveSlaMapping("code-751", "title-104");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
