import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultWarmupSummaryEngine } from "./default-warmup-summary-engine.js";
import { newDefaultWarmupSummary } from "./default-warmup-summary.js";

test("DefaultWarmupSummaryEngine keeps results within bounds", () => {
  const engine = defaultDefaultWarmupSummaryEngine(flags.newRegistry());
  const item = newDefaultWarmupSummary("code-379", "label-730");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
