import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredComplaintOverrideEngine } from "./tiered-complaint-override-engine.js";
import { newTieredComplaintOverride } from "./tiered-complaint-override.js";

test("TieredComplaintOverrideEngine keeps results within bounds", () => {
  const engine = defaultTieredComplaintOverrideEngine(flags.newRegistry());
  const item = newTieredComplaintOverride("code-332", "name-50");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
