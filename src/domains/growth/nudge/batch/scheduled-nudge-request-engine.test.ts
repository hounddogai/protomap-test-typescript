import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultScheduledNudgeRequestEngine } from "./scheduled-nudge-request-engine.js";
import { newScheduledNudgeRequest } from "./scheduled-nudge-request.js";

test("ScheduledNudgeRequestEngine keeps results within bounds", () => {
  const engine = defaultScheduledNudgeRequestEngine();
  const item = newScheduledNudgeRequest("code-323", "name-607");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
