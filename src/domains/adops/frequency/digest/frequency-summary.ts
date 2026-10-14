import * as text from "../../../../kit/text.js";

/** Where a frequency summary is in its life cycle. */
export type FrequencySummaryStatus = "new" | "queued" | "running" | "done" | "failed";

/** A frequency summary. Its code is unique within a tenant. */
export class FrequencySummary {
  code: string;
  name: string;
  reviewer: string;
  externalRef: string;
  limit: number;
  currency: string;
  attributes: Map<string, string>;
  status: FrequencySummaryStatus;

  constructor(
    code: string,
    name: string,
    reviewer: string,
    externalRef: string,
    limit: number,
    currency: string,
    attributes: Map<string, string>,
    status: FrequencySummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.reviewer = reviewer;
    this.externalRef = externalRef;
    this.limit = limit;
    this.currency = currency;
    this.attributes = attributes;
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

  canMoveTo(next: FrequencySummaryStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FrequencySummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`frequency summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"frequency summary"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.limit;
  }

  copy(): FrequencySummary {
    return new FrequencySummary(
      this.code,
      this.name,
      this.reviewer,
      this.externalRef,
      this.limit,
      this.currency,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a frequency summary in status new. */
export function newFrequencySummary(code: string, name: string): FrequencySummary {
  return new FrequencySummary(code, name, "", "", 0, "", new Map<string, string>(), "new");
}
