import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultPathAdjustmentEngine } from "./default-path-adjustment-engine.js";
import { newDefaultPathAdjustment } from "./default-path-adjustment.js";

test("DefaultPathAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultDefaultPathAdjustmentEngine(flags.newRegistry());
  const item = newDefaultPathAdjustment("code-789", "title-175");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
