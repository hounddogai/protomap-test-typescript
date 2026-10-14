import * as text from "../../../../kit/text.js";

/** Where a global pacing summary is in its life cycle. */
export type GlobalPacingSummaryStatus = "new" | "queued" | "running" | "done" | "failed";

/** A global pacing summary as the pacing team keeps it. */
export class GlobalPacingSummary {
  code: string;
  label: string;
  attributes: Map<string, string>;
  sequence: number;
  ceiling: number;
  name: string;
  utmSource: string;
  region: string;
  phone: string;
  locale: string;
  status: GlobalPacingSummaryStatus;

  constructor(
    code: string,
    label: string,
    attributes: Map<string, string>,
    sequence: number,
    ceiling: number,
    name: string,
    utmSource: string,
    region: string,
    phone: string,
    locale: string,
    status: GlobalPacingSummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.attributes = attributes;
    this.sequence = sequence;
    this.ceiling = ceiling;
    this.name = name;
    this.utmSource = utmSource;
    this.region = region;
    this.phone = phone;
    this.locale = locale;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalPacingSummaryStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        return next === "done";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: GlobalPacingSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global pacing summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"global pacing summary"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedExposure(): number {
    return Math.round((this.sequence + this.ceiling) * 100) / 100;
  }

  copy(): GlobalPacingSummary {
    return new GlobalPacingSummary(
      this.code,
      this.label,
      this.attributes,
      this.sequence,
      this.ceiling,
      this.name,
      this.utmSource,
      this.region,
      this.phone,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a global pacing summary in status new. */
export function newGlobalPacingSummary(code: string, label: string): GlobalPacingSummary {
  return new GlobalPacingSummary(code, label, new Map<string, string>(), 0, 0, "", "", "", "", "", "new");
}
