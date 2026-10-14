import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalPostOverrideEngine } from "./seasonal-post-override-engine.js";
import { newSeasonalPostOverride } from "./seasonal-post-override.js";

test("SeasonalPostOverrideEngine keeps results within bounds", () => {
  const engine = defaultSeasonalPostOverrideEngine(flags.newRegistry());
  const item = newSeasonalPostOverride("code-240", "name-591");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
