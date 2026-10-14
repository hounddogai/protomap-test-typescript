import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSlaAdjustmentEngine } from "./sla-adjustment-engine.js";
import { newSlaAdjustment } from "./sla-adjustment.js";

test("SlaAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultSlaAdjustmentEngine(flags.newRegistry());
  const item = newSlaAdjustment("code-297", "title-291");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
