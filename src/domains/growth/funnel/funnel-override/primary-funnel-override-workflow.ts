import * as clock from "../../../../kit/clock.js";
import { PrimaryFunnelOverrideEngine, defaultPrimaryFunnelOverrideEngine } from "./primary-funnel-override-engine.js";
import {
  PrimaryFunnelOverrideValidator,
  defaultPrimaryFunnelOverrideValidator,
} from "./primary-funnel-override-rules.js";
import { PrimaryFunnelOverrideStore } from "./primary-funnel-override-store.js";

/** Moves primary funnel overrides through their life cycle and keeps a journal of what it did. */
export class PrimaryFunnelOverrideDesk {
  store: PrimaryFunnelOverrideStore;
  validator: PrimaryFunnelOverrideValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimaryFunnelOverrideEngine;

  constructor(
    store: PrimaryFunnelOverrideStore,
    validator: PrimaryFunnelOverrideValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimaryFunnelOverrideEngine,
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
      throw new Error(`primary funnel override ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary funnel override ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary funnel override ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newPrimaryFunnelOverrideDesk(store: PrimaryFunnelOverrideStore, clockValue: clock.Clock): PrimaryFunnelOverrideDesk {
  return new PrimaryFunnelOverrideDesk(
    store,
    defaultPrimaryFunnelOverrideValidator(),
    clockValue,
    [],
    defaultPrimaryFunnelOverrideEngine(),
  );
}
