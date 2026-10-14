import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalEnrollmentSlot } from "./global-enrollment-slot.js";

test("GlobalEnrollmentSlot starts in created", () => {
  const item = newGlobalEnrollmentSlot("code-857", "title-273");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalEnrollmentSlot moves to published", () => {
  const item = newGlobalEnrollmentSlot("code-857", "title-273");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("GlobalEnrollmentSlot rejects moves from retired", () => {
  const item = newGlobalEnrollmentSlot("code-857", "title-273");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
