import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRegionalQueueProfileEngine } from "./regional-queue-profile-engine.js";
import { newRegionalQueueProfile } from "./regional-queue-profile.js";

test("RegionalQueueProfileEngine keeps results within bounds", () => {
  const engine = defaultRegionalQueueProfileEngine();
  const item = newRegionalQueueProfile("code-171", "name-113");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
