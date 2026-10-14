import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalSlaOverrideEngine } from "./seasonal-sla-override-engine.js";
import { newSeasonalSlaOverride } from "./seasonal-sla-override.js";

test("SeasonalSlaOverrideEngine keeps results within bounds", () => {
  const engine = defaultSeasonalSlaOverrideEngine(flags.newRegistry());
  const item = newSeasonalSlaOverride("code-432", "label-164");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
