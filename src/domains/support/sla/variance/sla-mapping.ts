import * as text from "../../../../kit/text.js";

/** Where a sla mapping is in its life cycle. */
export type SlaMappingStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One sla mapping, with what the planners need to act on it. */
export class SlaMapping {
  code: string;
  name: string;
  tags: string[];
  version: number;
  segment: string;
  description: string;
  amount: number;
  channel: string;
  externalRef: string;
  status: SlaMappingStatus;

  constructor(
    code: string,
    name: string,
    tags: string[],
    version: number,
    segment: string,
    description: string,
    amount: number,
    channel: string,
    externalRef: string,
    status: SlaMappingStatus,
  ) {
    this.code = code;
    this.name = name;
    this.tags = tags;
    this.version = version;
    this.segment = segment;
    this.description = description;
    this.amount = amount;
    this.channel = channel;
    this.externalRef = externalRef;
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

  canMoveTo(next: SlaMappingStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: SlaMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sla mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"sla mapping"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveTotal(): number {
    return Math.round((this.amount + this.version) * 100) / 100;
  }

  copy(): SlaMapping {
    return new SlaMapping(
      this.code,
      this.name,
      this.tags,
      this.version,
      this.segment,
      this.description,
      this.amount,
      this.channel,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a sla mapping in status proposed. */
export function newSlaMapping(code: string, name: string): SlaMapping {
  return new SlaMapping(code, name, [], 0, "", "", 0, "", "", "proposed");
}
