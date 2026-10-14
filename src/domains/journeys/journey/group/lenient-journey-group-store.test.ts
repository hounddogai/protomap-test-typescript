import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientJourneyGroupStore } from "./lenient-journey-group-store.js";
import { newLenientJourneyGroup } from "./lenient-journey-group.js";

test("MemoryLenientJourneyGroupStore finds what it saved", () => {
  const store = newMemoryLenientJourneyGroupStore();
  const item = newLenientJourneyGroup("code-559", "title-866");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
