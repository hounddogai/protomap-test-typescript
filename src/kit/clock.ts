/**
 * Clocks, so code that reads the time can be tested.
 */

/** Clock tells the current time in Unix seconds. */
export interface Clock {
  now(): number;
}

/** SystemClock reads the wall clock. */
export class SystemClock implements Clock {
  now(): number {
    return Math.floor(Date.now() / 1000);
  }
}

/** FixedClock always tells the same time. */
export class FixedClock implements Clock {
  at: number;

  constructor(at: number) {
    this.at = at;
  }

  now(): number {
    return this.at;
  }
}

/** OffsetClock runs ahead of (or behind) another clock by a fixed number of seconds. */
export class OffsetClock implements Clock {
  base: Clock;
  offset: number;

  constructor(base: Clock, offset: number) {
    this.base = base;
    this.offset = offset;
  }

  now(): number {
    return this.base.now() + this.offset;
  }
}

/** StepClock advances by step seconds every time it is read. */
export class StepClock implements Clock {
  current: number;
  step: number;

  constructor(current: number, step: number) {
    this.current = current;
    this.step = step;
  }

  now(): number {
    const at = this.current;
    this.current = this.current + this.step;
    return at;
  }
}

export function system(): Clock {
  return new SystemClock();
}
