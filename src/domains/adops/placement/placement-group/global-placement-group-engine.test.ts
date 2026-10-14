import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalPlacementGroupEngine } from "./global-placement-group-engine.js";
import { newGlobalPlacementGroup } from "./global-placement-group.js";

test("GlobalPlacementGroupEngine keeps results within bounds", () => {
  const engine = defaultGlobalPlacementGroupEngine(flags.newRegistry());
  const item = newGlobalPlacementGroup("code-113", "title-388");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
