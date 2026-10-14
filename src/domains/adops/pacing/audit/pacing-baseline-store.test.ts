import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPacingBaselineStore } from "./pacing-baseline-store.js";
import { newPacingBaseline } from "./pacing-baseline.js";

test("MemoryPacingBaselineStore finds what it saved", () => {
  const store = newMemoryPacingBaselineStore();
  const item = newPacingBaseline("code-946", "title-306");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
