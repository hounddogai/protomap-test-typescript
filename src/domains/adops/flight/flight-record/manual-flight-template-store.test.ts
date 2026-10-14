import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualFlightTemplateStore } from "./manual-flight-template-store.js";
import { newManualFlightTemplate } from "./manual-flight-template.js";

test("MemoryManualFlightTemplateStore finds what it saved", () => {
  const store = newMemoryManualFlightTemplateStore();
  const item = newManualFlightTemplate("code-152", "title-741");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
