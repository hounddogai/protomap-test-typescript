import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBadgeRequestEngine } from "./badge-request-engine.js";
import { newBadgeRequest } from "./badge-request.js";

test("BadgeRequestEngine keeps results within bounds", () => {
  const engine = defaultBadgeRequestEngine(flags.newRegistry());
  const item = newBadgeRequest("code-940", "label-769");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
