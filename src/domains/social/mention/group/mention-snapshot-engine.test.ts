import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultMentionSnapshotEngine } from "./mention-snapshot-engine.js";
import { newMentionSnapshot } from "./mention-snapshot.js";

test("MentionSnapshotEngine keeps results within bounds", () => {
  const engine = defaultMentionSnapshotEngine(flags.newRegistry());
  const item = newMentionSnapshot("code-735", "title-983");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
