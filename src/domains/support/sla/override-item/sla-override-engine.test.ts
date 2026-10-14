import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSlaOverrideEngine } from "./sla-override-engine.js";
import { newSlaOverride } from "./sla-override.js";

test("SlaOverrideEngine keeps results within bounds", () => {
  const engine = defaultSlaOverrideEngine(flags.newRegistry());
  const item = newSlaOverride("code-862", "name-482");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
