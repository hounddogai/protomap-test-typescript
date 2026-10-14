import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveCreditGroupEngine } from "./adaptive-credit-group-engine.js";
import { newAdaptiveCreditGroup } from "./adaptive-credit-group.js";

test("AdaptiveCreditGroupEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveCreditGroupEngine(flags.newRegistry());
  const item = newAdaptiveCreditGroup("code-324", "title-286");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
