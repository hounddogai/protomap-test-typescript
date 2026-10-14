import * as clock from "../../../../kit/clock.js";
import { ComplaintOverrideEngine, defaultComplaintOverrideEngine } from "./complaint-override-engine.js";
import { ComplaintOverrideValidator, defaultComplaintOverrideValidator } from "./complaint-override-rules.js";
import { ComplaintOverrideStore } from "./complaint-override-store.js";

/** Moves complaint overrides through their life cycle and keeps a journal of what it did. */
export class ComplaintOverrideService {
  store: ComplaintOverrideStore;
  validator: ComplaintOverrideValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ComplaintOverrideEngine;

  constructor(
    store: ComplaintOverrideStore,
    validator: ComplaintOverrideValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ComplaintOverrideEngine,
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
      throw new Error(`complaint override ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`complaint override ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`complaint override ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newComplaintOverrideService(store: ComplaintOverrideStore, clockValue: clock.Clock): ComplaintOverrideService {
  return new ComplaintOverrideService(
    store,
    defaultComplaintOverrideValidator(),
    clockValue,
    [],
    defaultComplaintOverrideEngine(),
  );
}
