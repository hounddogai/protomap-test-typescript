import * as clock from "../../../../kit/clock.js";
import { PrimaryFunnelTargetEngine, defaultPrimaryFunnelTargetEngine } from "./primary-funnel-target-engine.js";
import { PrimaryFunnelTargetValidator, defaultPrimaryFunnelTargetValidator } from "./primary-funnel-target-rules.js";
import { PrimaryFunnelTargetStore } from "./primary-funnel-target-store.js";

/** Moves primary funnel targets through their life cycle and keeps a journal of what it did. */
export class PrimaryFunnelTargetDesk {
  store: PrimaryFunnelTargetStore;
  validator: PrimaryFunnelTargetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimaryFunnelTargetEngine;

  constructor(
    store: PrimaryFunnelTargetStore,
    validator: PrimaryFunnelTargetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimaryFunnelTargetEngine,
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
      throw new Error(`primary funnel target ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary funnel target ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary funnel target ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newPrimaryFunnelTargetDesk(store: PrimaryFunnelTargetStore, clockValue: clock.Clock): PrimaryFunnelTargetDesk {
  return new PrimaryFunnelTargetDesk(
    store,
    defaultPrimaryFunnelTargetValidator(),
    clockValue,
    [],
    defaultPrimaryFunnelTargetEngine(),
  );
}
