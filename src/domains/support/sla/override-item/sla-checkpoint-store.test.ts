import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySlaCheckpointStore } from "./sla-checkpoint-store.js";
import { newSlaCheckpoint } from "./sla-checkpoint.js";

test("MemorySlaCheckpointStore finds what it saved", () => {
  const store = newMemorySlaCheckpointStore();
  const item = newSlaCheckpoint("code-615", "label-477");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
