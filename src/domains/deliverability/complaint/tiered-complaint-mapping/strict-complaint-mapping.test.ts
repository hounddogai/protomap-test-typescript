import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictComplaintMapping } from "./strict-complaint-mapping.js";

test("StrictComplaintMapping starts in planned", () => {
  const item = newStrictComplaintMapping("code-910", "name-268");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictComplaintMapping moves to scheduled", () => {
  const item = newStrictComplaintMapping("code-910", "name-268");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("StrictComplaintMapping rejects moves from cancelled", () => {
  const item = newStrictComplaintMapping("code-910", "name-268");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
