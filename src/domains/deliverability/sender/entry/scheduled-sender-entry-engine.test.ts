import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultScheduledSenderEntryEngine } from "./scheduled-sender-entry-engine.js";
import { newScheduledSenderEntry } from "./scheduled-sender-entry.js";

test("ScheduledSenderEntryEngine keeps results within bounds", () => {
  const engine = defaultScheduledSenderEntryEngine(flags.newRegistry());
  const item = newScheduledSenderEntry("code-969", "title-457");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
