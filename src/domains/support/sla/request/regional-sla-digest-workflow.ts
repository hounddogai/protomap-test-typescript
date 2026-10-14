import * as clock from "../../../../kit/clock.js";
import { RegionalSlaDigestEngine, defaultRegionalSlaDigestEngine } from "./regional-sla-digest-engine.js";
import { RegionalSlaDigestValidator, defaultRegionalSlaDigestValidator } from "./regional-sla-digest-rules.js";
import { RegionalSlaDigestStore } from "./regional-sla-digest-store.js";

/** Moves regional sla digests through their life cycle and keeps a journal of what it did. */
export class RegionalSlaDigestDesk {
  store: RegionalSlaDigestStore;
  validator: RegionalSlaDigestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RegionalSlaDigestEngine;

  constructor(
    store: RegionalSlaDigestStore,
    validator: RegionalSlaDigestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RegionalSlaDigestEngine,
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
    this.engine = engine;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional sla digest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional sla digest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional sla digest ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRegionalSlaDigestDesk(store: RegionalSlaDigestStore, clockValue: clock.Clock): RegionalSlaDigestDesk {
  return new RegionalSlaDigestDesk(
    store,
    defaultRegionalSlaDigestValidator(),
    clockValue,
    [],
    defaultRegionalSlaDigestEngine(),
  );
}
