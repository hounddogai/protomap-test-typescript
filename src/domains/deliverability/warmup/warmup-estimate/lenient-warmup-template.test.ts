import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientWarmupTemplate } from "./lenient-warmup-template.js";

test("LenientWarmupTemplate starts in created", () => {
  const item = newLenientWarmupTemplate("code-596", "label-255");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientWarmupTemplate moves to validated", () => {
  const item = newLenientWarmupTemplate("code-596", "label-255");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("LenientWarmupTemplate rejects moves from retired", () => {
  const item = newLenientWarmupTemplate("code-596", "label-255");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
