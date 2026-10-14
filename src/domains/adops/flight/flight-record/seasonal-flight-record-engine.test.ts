import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalFlightRecordEngine } from "./seasonal-flight-record-engine.js";
import { newSeasonalFlightRecord } from "./seasonal-flight-record.js";

test("SeasonalFlightRecordEngine keeps results within bounds", () => {
  const engine = defaultSeasonalFlightRecordEngine(flags.newRegistry());
  const item = newSeasonalFlightRecord("code-830", "name-456");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
