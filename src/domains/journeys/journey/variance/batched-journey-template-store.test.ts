import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedJourneyTemplateStore } from "./batched-journey-template-store.js";
import { newBatchedJourneyTemplate } from "./batched-journey-template.js";

test("MemoryBatchedJourneyTemplateStore finds what it saved", () => {
  const store = newMemoryBatchedJourneyTemplateStore();
  const item = newBatchedJourneyTemplate("code-338", "title-425");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
