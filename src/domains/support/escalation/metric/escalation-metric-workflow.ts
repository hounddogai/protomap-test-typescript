import * as clock from "../../../../kit/clock.js";
import { EscalationMetricEngine, defaultEscalationMetricEngine } from "./escalation-metric-engine.js";
import { EscalationMetricValidator, defaultEscalationMetricValidator } from "./escalation-metric-rules.js";
import { EscalationMetricStore } from "./escalation-metric-store.js";

/** Moves escalation metrics through their life cycle and keeps a journal of what it did. */
export class EscalationMetricService {
  store: EscalationMetricStore;
  validator: EscalationMetricValidator;
  clock: clock.Clock;
  journal: string[];
  engine: EscalationMetricEngine;

  constructor(
    store: EscalationMetricStore,
    validator: EscalationMetricValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: EscalationMetricEngine,
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
      throw new Error(`escalation metric ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`escalation metric ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`escalation metric ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newEscalationMetricService(store: EscalationMetricStore, clockValue: clock.Clock): EscalationMetricService {
  return new EscalationMetricService(
    store,
    defaultEscalationMetricValidator(),
    clockValue,
    [],
    defaultEscalationMetricEngine(),
  );
}
