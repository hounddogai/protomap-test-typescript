import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  ManualTicketViewEstimateEngine,
  defaultManualTicketViewEstimateEngine,
} from "./manual-ticket-view-estimate-engine.js";
import {
  ManualTicketViewEstimateValidator,
  defaultManualTicketViewEstimateValidator,
} from "./manual-ticket-view-estimate-rules.js";
import { ManualTicketViewEstimateStore } from "./manual-ticket-view-estimate-store.js";

/** Moves manual ticket view estimates through their life cycle and keeps a journal of what it did. */
export class ManualTicketViewEstimateWorkflow {
  store: ManualTicketViewEstimateStore;
  validator: ManualTicketViewEstimateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ManualTicketViewEstimateEngine;

  constructor(
    store: ManualTicketViewEstimateStore,
    validator: ManualTicketViewEstimateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ManualTicketViewEstimateEngine,
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
      throw new Error(`manual ticket view estimate ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual ticket view estimate ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual ticket view estimate ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newManualTicketViewEstimateWorkflow(store: ManualTicketViewEstimateStore, clockValue: clock.Clock, flagsValue: flags.Registry): ManualTicketViewEstimateWorkflow {
  return new ManualTicketViewEstimateWorkflow(
    store,
    defaultManualTicketViewEstimateValidator(),
    clockValue,
    [],
    defaultManualTicketViewEstimateEngine(flagsValue),
  );
}
