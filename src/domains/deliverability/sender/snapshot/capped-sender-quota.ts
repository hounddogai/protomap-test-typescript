import * as text from "../../../../kit/text.js";

/** Where a capped sender quota is in its life cycle. */
export type CappedSenderQuotaStatus = "created" | "validated" | "published" | "retired";

/** The record of a capped sender quota and its current status. */
export class CappedSenderQuota {
  code: string;
  title: string;
  amount: number;
  region: string;
  minimum: number;
  margin: number;
  attributes: Map<string, string>;
  status: CappedSenderQuotaStatus;

  constructor(
    code: string,
    title: string,
    amount: number,
    region: string,
    minimum: number,
    margin: number,
    attributes: Map<string, string>,
    status: CappedSenderQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.amount = amount;
    this.region = region;
    this.minimum = minimum;
    this.margin = margin;
    this.attributes = attributes;
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

  canMoveTo(next: CappedSenderQuotaStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: CappedSenderQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped sender quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"capped sender quota"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveLoad(): number {
    return Math.round((this.minimum + this.margin) * 100) / 100;
  }

  copy(): CappedSenderQuota {
    return new CappedSenderQuota(
      this.code,
      this.title,
      this.amount,
      this.region,
      this.minimum,
      this.margin,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a capped sender quota in status created. */
export function newCappedSenderQuota(code: string, title: string): CappedSenderQuota {
  return new CappedSenderQuota(code, title, 0, "", 0, 0, new Map<string, string>(), "created");
}
