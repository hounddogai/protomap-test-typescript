import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryDeflectionCycle } from "./primary-deflection-cycle.js";

test("PrimaryDeflectionCycle starts in new", () => {
  const item = newPrimaryDeflectionCycle("code-39", "label-310");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryDeflectionCycle moves to queued", () => {
  const item = newPrimaryDeflectionCycle("code-39", "label-310");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("PrimaryDeflectionCycle rejects moves from failed", () => {
  const item = newPrimaryDeflectionCycle("code-39", "label-310");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
