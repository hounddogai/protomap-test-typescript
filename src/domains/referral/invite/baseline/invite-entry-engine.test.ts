import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultInviteEntryEngine } from "./invite-entry-engine.js";
import { newInviteEntry } from "./invite-entry.js";

test("InviteEntryEngine keeps results within bounds", () => {
  const engine = defaultInviteEntryEngine(flags.newRegistry());
  const item = newInviteEntry("code-796", "title-357");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
