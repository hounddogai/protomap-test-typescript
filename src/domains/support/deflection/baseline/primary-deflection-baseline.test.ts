import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryDeflectionBaseline } from "./primary-deflection-baseline.js";

test("PrimaryDeflectionBaseline starts in proposed", () => {
  const item = newPrimaryDeflectionBaseline("code-683", "title-844");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryDeflectionBaseline moves to approved", () => {
  const item = newPrimaryDeflectionBaseline("code-683", "title-844");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("PrimaryDeflectionBaseline rejects moves from withdrawn", () => {
  const item = newPrimaryDeflectionBaseline("code-683", "title-844");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
