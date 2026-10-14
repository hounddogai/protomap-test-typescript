import * as text from "../../../../kit/text.js";

/** Where a primary sender rollup is in its life cycle. */
export type PrimarySenderRollupStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A primary sender rollup. Its code is unique within a tenant. */
export class PrimarySenderRollup {
  code: string;
  name: string;
  conversionRate: number;
  source: string;
  utmSource: string;
  locale: string;
  currency: string;
  audienceId: string;
  status: PrimarySenderRollupStatus;

  constructor(
    code: string,
    name: string,
    conversionRate: number,
    source: string,
    utmSource: string,
    locale: string,
    currency: string,
    audienceId: string,
    status: PrimarySenderRollupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.conversionRate = conversionRate;
    this.source = source;
    this.utmSource = utmSource;
    this.locale = locale;
    this.currency = currency;
    this.audienceId = audienceId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimarySenderRollupStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: PrimarySenderRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary sender rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  measuredValue(): number {
    return this.conversionRate;
  }

  copy(): PrimarySenderRollup {
    return new PrimarySenderRollup(
      this.code,
      this.name,
      this.conversionRate,
      this.source,
      this.utmSource,
      this.locale,
      this.currency,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a primary sender rollup in status idle. */
export function newPrimarySenderRollup(code: string, name: string): PrimarySenderRollup {
  return new PrimarySenderRollup(code, name, 0, "", "", "", "", "", "idle");
}
