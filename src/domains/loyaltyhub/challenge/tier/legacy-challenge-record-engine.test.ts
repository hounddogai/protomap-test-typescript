import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacyChallengeRecordEngine } from "./legacy-challenge-record-engine.js";
import { newLegacyChallengeRecord } from "./legacy-challenge-record.js";

test("LegacyChallengeRecordEngine keeps results within bounds", () => {
  const engine = defaultLegacyChallengeRecordEngine();
  const item = newLegacyChallengeRecord("code-465", "name-880");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
