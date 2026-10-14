import assert from "node:assert/strict";
import { test } from "node:test";
import { newSlaRequest } from "./sla-request.js";

test("SlaRequest starts in planned", () => {
  const item = newSlaRequest("code-898", "name-10");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SlaRequest moves to scheduled", () => {
  const item = newSlaRequest("code-898", "name-10");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("SlaRequest rejects moves from cancelled", () => {
  const item = newSlaRequest("code-898", "name-10");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
