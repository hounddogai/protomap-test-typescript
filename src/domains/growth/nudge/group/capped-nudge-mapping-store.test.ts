import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedNudgeMappingStore } from "./capped-nudge-mapping-store.js";
import { newCappedNudgeMapping } from "./capped-nudge-mapping.js";

test("MemoryCappedNudgeMappingStore finds what it saved", () => {
  const store = newMemoryCappedNudgeMappingStore();
  const item = newCappedNudgeMapping("code-694", "label-980");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
