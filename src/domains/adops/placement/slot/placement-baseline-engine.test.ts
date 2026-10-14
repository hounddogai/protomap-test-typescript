import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPlacementBaselineEngine } from "./placement-baseline-engine.js";
import { newPlacementBaseline } from "./placement-baseline.js";

test("PlacementBaselineEngine keeps results within bounds", () => {
  const engine = defaultPlacementBaselineEngine(flags.newRegistry());
  const item = newPlacementBaseline("code-828", "label-396");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
