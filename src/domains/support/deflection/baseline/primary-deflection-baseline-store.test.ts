import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryDeflectionBaselineStore } from "./primary-deflection-baseline-store.js";
import { newPrimaryDeflectionBaseline } from "./primary-deflection-baseline.js";

test("MemoryPrimaryDeflectionBaselineStore finds what it saved", () => {
  const store = newMemoryPrimaryDeflectionBaselineStore();
  const item = newPrimaryDeflectionBaseline("code-683", "title-844");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
