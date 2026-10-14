import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultManualRetentionMappingEngine } from "./manual-retention-mapping-engine.js";
import { newManualRetentionMapping } from "./manual-retention-mapping.js";

test("ManualRetentionMappingEngine keeps results within bounds", () => {
  const engine = defaultManualRetentionMappingEngine(flags.newRegistry());
  const item = newManualRetentionMapping("code-240", "title-906");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
