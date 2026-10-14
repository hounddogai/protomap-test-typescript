import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalRewardEntryEngine } from "./seasonal-reward-entry-engine.js";
import { newSeasonalRewardEntry } from "./seasonal-reward-entry.js";

test("SeasonalRewardEntryEngine keeps results within bounds", () => {
  const engine = defaultSeasonalRewardEntryEngine(flags.newRegistry());
  const item = newSeasonalRewardEntry("code-831", "title-451");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
