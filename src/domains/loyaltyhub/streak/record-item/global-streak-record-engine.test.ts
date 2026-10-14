import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalStreakRecordEngine } from "./global-streak-record-engine.js";
import { newGlobalStreakRecord } from "./global-streak-record.js";

test("GlobalStreakRecordEngine keeps results within bounds", () => {
  const engine = defaultGlobalStreakRecordEngine(flags.newRegistry());
  const item = newGlobalStreakRecord("code-629", "name-935");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
