import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimarySlaCheckpointStore } from "./primary-sla-checkpoint-store.js";
import { newPrimarySlaCheckpoint } from "./primary-sla-checkpoint.js";

test("MemoryPrimarySlaCheckpointStore finds what it saved", () => {
  const store = newMemoryPrimarySlaCheckpointStore();
  const item = newPrimarySlaCheckpoint("code-695", "title-585");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
