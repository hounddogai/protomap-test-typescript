import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalModelRecordEngine } from "./seasonal-model-record-engine.js";
import { newSeasonalModelRecord } from "./seasonal-model-record.js";

test("SeasonalModelRecordEngine keeps results within bounds", () => {
  const engine = defaultSeasonalModelRecordEngine();
  const item = newSeasonalModelRecord("code-653", "name-64");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
