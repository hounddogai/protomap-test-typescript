import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyTierEntryEngine } from "./legacy-tier-entry-engine.js";
import { newLegacyTierEntry } from "./legacy-tier-entry.js";

test("LegacyTierEntryEngine keeps results within bounds", () => {
  const engine = defaultLegacyTierEntryEngine(flags.newRegistry());
  const item = newLegacyTierEntry("code-922", "title-513");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
