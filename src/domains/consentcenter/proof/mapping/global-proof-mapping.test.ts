import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalProofMapping } from "./global-proof-mapping.js";

test("GlobalProofMapping starts in open", () => {
  const item = newGlobalProofMapping("code-830", "label-257");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalProofMapping moves to reopened", () => {
  const item = newGlobalProofMapping("code-830", "label-257");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("GlobalProofMapping rejects moves from archived", () => {
  const item = newGlobalProofMapping("code-830", "label-257");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
