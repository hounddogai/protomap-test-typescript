import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultInviteRequestEngine } from "./invite-request-engine.js";
import { newInviteRequest } from "./invite-request.js";

test("InviteRequestEngine keeps results within bounds", () => {
  const engine = defaultInviteRequestEngine(flags.newRegistry());
  const item = newInviteRequest("code-518", "title-601");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
