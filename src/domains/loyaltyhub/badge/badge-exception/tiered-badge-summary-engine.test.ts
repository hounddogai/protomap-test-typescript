import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredBadgeSummaryEngine } from "./tiered-badge-summary-engine.js";
import { newTieredBadgeSummary } from "./tiered-badge-summary.js";

test("TieredBadgeSummaryEngine keeps results within bounds", () => {
  const engine = defaultTieredBadgeSummaryEngine(flags.newRegistry());
  const item = newTieredBadgeSummary("code-575", "title-736");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
