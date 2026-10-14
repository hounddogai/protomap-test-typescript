import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalComplaintMapping } from "./regional-complaint-mapping.js";

test("RegionalComplaintMapping starts in new", () => {
  const item = newRegionalComplaintMapping("code-118", "name-475");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalComplaintMapping moves to queued", () => {
  const item = newRegionalComplaintMapping("code-118", "name-475");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("RegionalComplaintMapping rejects moves from failed", () => {
  const item = newRegionalComplaintMapping("code-118", "name-475");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
