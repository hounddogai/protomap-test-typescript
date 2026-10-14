import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultManualChallengeBatchEngine } from "./manual-challenge-batch-engine.js";
import { newManualChallengeBatch } from "./manual-challenge-batch.js";

test("ManualChallengeBatchEngine keeps results within bounds", () => {
  const engine = defaultManualChallengeBatchEngine();
  const item = newManualChallengeBatch("code-674", "title-615");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
