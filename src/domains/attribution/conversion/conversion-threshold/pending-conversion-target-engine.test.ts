import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPendingConversionTargetEngine } from "./pending-conversion-target-engine.js";
import { newPendingConversionTarget } from "./pending-conversion-target.js";

test("PendingConversionTargetEngine keeps results within bounds", () => {
  const engine = defaultPendingConversionTargetEngine();
  const item = newPendingConversionTarget("code-611", "title-575");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
