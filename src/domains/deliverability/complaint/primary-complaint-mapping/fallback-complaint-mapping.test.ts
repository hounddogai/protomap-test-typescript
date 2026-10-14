import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackComplaintMapping } from "./fallback-complaint-mapping.js";

test("FallbackComplaintMapping starts in created", () => {
  const item = newFallbackComplaintMapping("code-537", "name-99");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackComplaintMapping moves to published", () => {
  const item = newFallbackComplaintMapping("code-537", "name-99");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("FallbackComplaintMapping rejects moves from retired", () => {
  const item = newFallbackComplaintMapping("code-537", "name-99");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
