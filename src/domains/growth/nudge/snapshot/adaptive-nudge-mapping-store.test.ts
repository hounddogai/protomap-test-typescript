import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveNudgeMappingStore } from "./adaptive-nudge-mapping-store.js";
import { newAdaptiveNudgeMapping } from "./adaptive-nudge-mapping.js";

test("MemoryAdaptiveNudgeMappingStore finds what it saved", () => {
  const store = newMemoryAdaptiveNudgeMappingStore();
  const item = newAdaptiveNudgeMapping("code-601", "name-824");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
