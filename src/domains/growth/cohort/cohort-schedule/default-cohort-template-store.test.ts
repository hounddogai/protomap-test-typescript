import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultCohortTemplateStore } from "./default-cohort-template-store.js";
import { newDefaultCohortTemplate } from "./default-cohort-template.js";

test("MemoryDefaultCohortTemplateStore finds what it saved", () => {
  const store = newMemoryDefaultCohortTemplateStore();
  const item = newDefaultCohortTemplate("code-863", "name-508");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
