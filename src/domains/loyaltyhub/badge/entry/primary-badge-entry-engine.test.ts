import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryBadgeEntryEngine } from "./primary-badge-entry-engine.js";
import { newPrimaryBadgeEntry } from "./primary-badge-entry.js";

test("PrimaryBadgeEntryEngine keeps results within bounds", () => {
  const engine = defaultPrimaryBadgeEntryEngine(flags.newRegistry());
  const item = newPrimaryBadgeEntry("code-407", "label-560");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
