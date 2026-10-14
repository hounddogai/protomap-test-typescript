import * as text from "../../../../kit/text.js";

/** Where a frequency digest is in its life cycle. */
export type FrequencyDigestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One frequency digest, with what the planners need to act on it. */
export class FrequencyDigest {
  code: string;
  name: string;
  batchSize: number;
  title: string;
  unit: string;
  utmSource: string;
  amount: number;
  impressions: number;
  durationMinutes: number;
  status: FrequencyDigestStatus;

  constructor(
    code: string,
    name: string,
    batchSize: number,
    title: string,
    unit: string,
    utmSource: string,
    amount: number,
    impressions: number,
    durationMinutes: number,
    status: FrequencyDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.batchSize = batchSize;
    this.title = title;
    this.unit = unit;
    this.utmSource = utmSource;
    this.amount = amount;
    this.impressions = impressions;
    this.durationMinutes = durationMinutes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: FrequencyDigestStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: FrequencyDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`frequency digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedLoad(): number {
    return Math.round(this.durationMinutes * this.amount * 100) / 100;
  }

  copy(): FrequencyDigest {
    return new FrequencyDigest(
      this.code,
      this.name,
      this.batchSize,
      this.title,
      this.unit,
      this.utmSource,
      this.amount,
      this.impressions,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a frequency digest in status open. */
export function newFrequencyDigest(code: string, name: string): FrequencyDigest {
  return new FrequencyDigest(code, name, 0, "", "", "", 0, 0, 0, "open");
}
