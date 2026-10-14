import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalInviteRequestEngine } from "./regional-invite-request-engine.js";
import { newRegionalInviteRequest } from "./regional-invite-request.js";

test("RegionalInviteRequestEngine keeps results within bounds", () => {
  const engine = defaultRegionalInviteRequestEngine(flags.newRegistry());
  const item = newRegionalInviteRequest("code-218", "label-798");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
