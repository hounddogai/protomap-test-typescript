import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalInviteRequestEngine } from "./seasonal-invite-request-engine.js";
import { newSeasonalInviteRequest } from "./seasonal-invite-request.js";

test("SeasonalInviteRequestEngine keeps results within bounds", () => {
  const engine = defaultSeasonalInviteRequestEngine(flags.newRegistry());
  const item = newSeasonalInviteRequest("code-620", "name-51");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
