import { QueueReservation } from "./queue-reservation.js";

/** One step of the queue reservation calculation. */
export interface QueueReservationStep {
  describe(): string;
  adjust(item: QueueReservation, value: number): number;
}

export class PercentQueueReservationAdjuster implements QueueReservationStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: QueueReservation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapQueueReservationAdjuster implements QueueReservationStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: QueueReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class QueueReservationBudgetOffsetAdjuster implements QueueReservationStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: QueueReservation, value: number): number {
    return value + item.budget * this.weight;
  }
}

/** Runs the queue reservation steps in order and keeps a trace of each. */
export class QueueReservationEngine {
  steps: QueueReservationStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: QueueReservationStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: QueueReservation): number {
    let current = item.netExposure();
    this.trace = [];
    for (let index = 0; index < this.steps.length; index++) {
      const step = this.steps[index]!;
      const before = current;
      current = step.adjust(item, current);
      if (before !== current) {
        this.trace.push(`${index + 1}. ${step.describe()} changed ${before} to ${current}`);
      }
    }
    if (current < this.floor) return this.floor;
    if (current > this.ceiling) return this.ceiling;
    return current;
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: QueueReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultQueueReservationEngine(): QueueReservationEngine {
  return new QueueReservationEngine(
    [
      new PercentQueueReservationAdjuster(23.1),
      new CapQueueReservationAdjuster(19068),
      new QueueReservationBudgetOffsetAdjuster(0.92),
    ],
    [],
    1.5,
    86581,
  );
}
