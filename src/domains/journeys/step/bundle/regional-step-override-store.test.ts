import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalStepOverrideStore } from "./regional-step-override-store.js";
import { newRegionalStepOverride } from "./regional-step-override.js";

test("MemoryRegionalStepOverrideStore finds what it saved", () => {
  const store = newMemoryRegionalStepOverrideStore();
  const item = newRegionalStepOverride("code-123", "label-711");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
