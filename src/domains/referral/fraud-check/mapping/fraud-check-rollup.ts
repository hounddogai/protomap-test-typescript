import * as text from "../../../../kit/text.js";

/** Where a fraud check rollup is in its life cycle. */
export type FraudCheckRollupStatus = "created" | "validated" | "published" | "retired";

/** The record of a fraud check rollup and its current status. */
export class FraudCheckRollup {
  code: string;
  name: string;
  visible: boolean;
  margin: number;
  timezone: string;
  conversionRate: number;
  utmSource: string;
  segment: string;
  locale: string;
  capacity: number;
  status: FraudCheckRollupStatus;

  constructor(
    code: string,
    name: string,
    visible: boolean,
    margin: number,
    timezone: string,
    conversionRate: number,
    utmSource: string,
    segment: string,
    locale: string,
    capacity: number,
    status: FraudCheckRollupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.visible = visible;
    this.margin = margin;
    this.timezone = timezone;
    this.conversionRate = conversionRate;
    this.utmSource = utmSource;
    this.segment = segment;
    this.locale = locale;
    this.capacity = capacity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: FraudCheckRollupStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FraudCheckRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fraud check rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netVolume(): number {
    return Math.round(this.margin * this.capacity * 100) / 100;
  }

  copy(): FraudCheckRollup {
    return new FraudCheckRollup(
      this.code,
      this.name,
      this.visible,
      this.margin,
      this.timezone,
      this.conversionRate,
      this.utmSource,
      this.segment,
      this.locale,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a fraud check rollup in status created. */
export function newFraudCheckRollup(code: string, name: string): FraudCheckRollup {
  return new FraudCheckRollup(code, name, false, 0, "", 0, "", "", "", 0, "created");
}
