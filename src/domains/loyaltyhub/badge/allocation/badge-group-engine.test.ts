import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBadgeGroupEngine } from "./badge-group-engine.js";
import { newBadgeGroup } from "./badge-group.js";

test("BadgeGroupEngine keeps results within bounds", () => {
  const engine = defaultBadgeGroupEngine(flags.newRegistry());
  const item = newBadgeGroup("code-433", "title-238");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
