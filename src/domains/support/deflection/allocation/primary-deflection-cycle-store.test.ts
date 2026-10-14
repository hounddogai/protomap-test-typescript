import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryDeflectionCycleStore } from "./primary-deflection-cycle-store.js";
import { newPrimaryDeflectionCycle } from "./primary-deflection-cycle.js";

test("MemoryPrimaryDeflectionCycleStore finds what it saved", () => {
  const store = newMemoryPrimaryDeflectionCycleStore();
  const item = newPrimaryDeflectionCycle("code-39", "label-310");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
