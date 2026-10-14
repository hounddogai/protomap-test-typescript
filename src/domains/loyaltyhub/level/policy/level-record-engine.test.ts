import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLevelRecordEngine } from "./level-record-engine.js";
import { newLevelRecord } from "./level-record.js";

test("LevelRecordEngine keeps results within bounds", () => {
  const engine = defaultLevelRecordEngine();
  const item = newLevelRecord("code-891", "label-132");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
