import * as clock from "../../../../kit/clock.js";
import { ExitRuleManifestValidator, defaultExitRuleManifestValidator } from "./exit-rule-manifest-rules.js";
import { ExitRuleManifestStore } from "./exit-rule-manifest-store.js";

/** Moves exit rule manifests through their life cycle and keeps a journal of what it did. */
export class ExitRuleManifestManager {
  store: ExitRuleManifestStore;
  validator: ExitRuleManifestValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: ExitRuleManifestStore,
    validator: ExitRuleManifestValidator,
    clockValue: clock.Clock,
    journal: string[],
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`exit rule manifest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`exit rule manifest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newExitRuleManifestManager(store: ExitRuleManifestStore, clockValue: clock.Clock): ExitRuleManifestManager {
  return new ExitRuleManifestManager(store, defaultExitRuleManifestValidator(), clockValue, []);
}
