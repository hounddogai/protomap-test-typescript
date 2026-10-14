import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ProofQuotaEngine, defaultProofQuotaEngine } from "./proof-quota-engine.js";
import { ProofQuotaValidator, defaultProofQuotaValidator } from "./proof-quota-rules.js";
import { ProofQuotaStore } from "./proof-quota-store.js";

/** Moves proof quotas through their life cycle and keeps a journal of what it did. */
export class ProofQuotaService {
  store: ProofQuotaStore;
  validator: ProofQuotaValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ProofQuotaEngine;

  constructor(
    store: ProofQuotaStore,
    validator: ProofQuotaValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ProofQuotaEngine,
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
      throw new Error(`proof quota ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`proof quota ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`proof quota ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newProofQuotaService(store: ProofQuotaStore, clockValue: clock.Clock, flagsValue: flags.Registry): ProofQuotaService {
  return new ProofQuotaService(
    store,
    defaultProofQuotaValidator(),
    clockValue,
    [],
    defaultProofQuotaEngine(flagsValue),
  );
}
