import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBadgeVarianceEngine } from "./badge-variance-engine.js";
import { newBadgeVariance } from "./badge-variance.js";

test("BadgeVarianceEngine keeps results within bounds", () => {
  const engine = defaultBadgeVarianceEngine(flags.newRegistry());
  const item = newBadgeVariance("code-262", "name-445");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
