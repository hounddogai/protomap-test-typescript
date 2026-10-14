import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PendingFunnelSlotEngine, defaultPendingFunnelSlotEngine } from "./pending-funnel-slot-engine.js";
import { PendingFunnelSlotValidator, defaultPendingFunnelSlotValidator } from "./pending-funnel-slot-rules.js";
import { PendingFunnelSlotStore } from "./pending-funnel-slot-store.js";

/** Moves pending funnel slots through their life cycle and keeps a journal of what it did. */
export class PendingFunnelSlotWorkflow {
  store: PendingFunnelSlotStore;
  validator: PendingFunnelSlotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingFunnelSlotEngine;

  constructor(
    store: PendingFunnelSlotStore,
    validator: PendingFunnelSlotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingFunnelSlotEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending funnel slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending funnel slot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending funnel slot ${code} not found`);
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

export function newPendingFunnelSlotWorkflow(store: PendingFunnelSlotStore, clockValue: clock.Clock, flagsValue: flags.Registry): PendingFunnelSlotWorkflow {
  return new PendingFunnelSlotWorkflow(
    store,
    defaultPendingFunnelSlotValidator(),
    clockValue,
    [],
    defaultPendingFunnelSlotEngine(flagsValue),
  );
}
