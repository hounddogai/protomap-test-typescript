import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalComplaintWindow } from "./regional-complaint-window.js";

test("RegionalComplaintWindow starts in planned", () => {
  const item = newRegionalComplaintWindow("code-965", "name-732");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalComplaintWindow moves to scheduled", () => {
  const item = newRegionalComplaintWindow("code-965", "name-732");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("RegionalComplaintWindow rejects moves from cancelled", () => {
  const item = newRegionalComplaintWindow("code-965", "name-732");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
