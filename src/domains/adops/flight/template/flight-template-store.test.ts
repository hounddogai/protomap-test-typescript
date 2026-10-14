import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFlightTemplateStore } from "./flight-template-store.js";
import { newFlightTemplate } from "./flight-template.js";

test("MemoryFlightTemplateStore finds what it saved", () => {
  const store = newMemoryFlightTemplateStore();
  const item = newFlightTemplate("code-114", "name-779");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
