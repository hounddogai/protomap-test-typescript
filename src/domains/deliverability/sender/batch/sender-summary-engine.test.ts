import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSenderSummaryEngine } from "./sender-summary-engine.js";
import { newSenderSummary } from "./sender-summary.js";

test("SenderSummaryEngine keeps results within bounds", () => {
  const engine = defaultSenderSummaryEngine(flags.newRegistry());
  const item = newSenderSummary("code-616", "name-239");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
