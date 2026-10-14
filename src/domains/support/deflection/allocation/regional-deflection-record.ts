import * as text from "../../../../kit/text.js";

/** Where a regional deflection record is in its life cycle. */
export type RegionalDeflectionRecordStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A regional deflection record as the deflection team keeps it. */
export class RegionalDeflectionRecord {
  code: string;
  label: string;
  reviewer: string;
  tags: string[];
  sendAt: number;
  threshold: number;
  cost: number;
  phone: string;
  visible: boolean;
  attributes: Map<string, string>;
  status: RegionalDeflectionRecordStatus;

  constructor(
    code: string,
    label: string,
    reviewer: string,
    tags: string[],
    sendAt: number,
    threshold: number,
    cost: number,
    phone: string,
    visible: boolean,
    attributes: Map<string, string>,
    status: RegionalDeflectionRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.reviewer = reviewer;
    this.tags = tags;
    this.sendAt = sendAt;
    this.threshold = threshold;
    this.cost = cost;
    this.phone = phone;
    this.visible = visible;
    this.attributes = attributes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalDeflectionRecordStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: RegionalDeflectionRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional deflection record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveLoad(): number {
    return Math.round((this.cost - this.sendAt) * 100) / 100;
  }

  copy(): RegionalDeflectionRecord {
    return new RegionalDeflectionRecord(
      this.code,
      this.label,
      this.reviewer,
      this.tags,
      this.sendAt,
      this.threshold,
      this.cost,
      this.phone,
      this.visible,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a regional deflection record in status proposed. */
export function newRegionalDeflectionRecord(code: string, label: string): RegionalDeflectionRecord {
  return new RegionalDeflectionRecord(code, label, "", [], 0, 0, 0, "", false, new Map<string, string>(), "proposed");
}
