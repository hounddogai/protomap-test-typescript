import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedJourneyTemplateStore } from "./weighted-journey-template-store.js";
import { newWeightedJourneyTemplate } from "./weighted-journey-template.js";

test("MemoryWeightedJourneyTemplateStore finds what it saved", () => {
  const store = newMemoryWeightedJourneyTemplateStore();
  const item = newWeightedJourneyTemplate("code-19", "label-465");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
