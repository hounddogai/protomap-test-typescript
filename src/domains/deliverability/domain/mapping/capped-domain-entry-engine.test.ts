import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCappedDomainEntryEngine } from "./capped-domain-entry-engine.js";
import { newCappedDomainEntry } from "./capped-domain-entry.js";

test("CappedDomainEntryEngine keeps results within bounds", () => {
  const engine = defaultCappedDomainEntryEngine(flags.newRegistry());
  const item = newCappedDomainEntry("code-856", "name-165");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
