import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalLevelWindowEngine } from "./seasonal-level-window-engine.js";
import { newSeasonalLevelWindow } from "./seasonal-level-window.js";

test("SeasonalLevelWindowEngine keeps results within bounds", () => {
  const engine = defaultSeasonalLevelWindowEngine(flags.newRegistry());
  const item = newSeasonalLevelWindow("code-484", "name-478");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
