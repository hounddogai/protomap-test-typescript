import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWindowQuotaEngine } from "./window-quota-engine.js";
import { newWindowQuota } from "./window-quota.js";

test("WindowQuotaEngine keeps results within bounds", () => {
  const engine = defaultWindowQuotaEngine();
  const item = newWindowQuota("code-738", "title-660");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
