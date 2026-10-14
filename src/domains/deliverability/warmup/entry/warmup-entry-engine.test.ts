import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWarmupEntryEngine } from "./warmup-entry-engine.js";
import { newWarmupEntry } from "./warmup-entry.js";

test("WarmupEntryEngine keeps results within bounds", () => {
  const engine = defaultWarmupEntryEngine(flags.newRegistry());
  const item = newWarmupEntry("code-721", "title-771");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
