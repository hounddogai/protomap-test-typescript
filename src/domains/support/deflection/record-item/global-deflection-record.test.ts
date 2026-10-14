import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalDeflectionRecord } from "./global-deflection-record.js";

test("GlobalDeflectionRecord starts in created", () => {
  const item = newGlobalDeflectionRecord("code-298", "label-328");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalDeflectionRecord moves to validated", () => {
  const item = newGlobalDeflectionRecord("code-298", "label-328");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("GlobalDeflectionRecord rejects moves from retired", () => {
  const item = newGlobalDeflectionRecord("code-298", "label-328");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
